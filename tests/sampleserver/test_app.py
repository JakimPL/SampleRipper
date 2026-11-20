from __future__ import annotations

import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Final

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Connection, text
from trackmod.core.samples.depth import BitDepth

from samplecore.models.channels import ChannelLayout
from samplecore.models.sample import Sample
from samplecore.models.service_role import ServiceRole
from samplecore.models.spectral import SampleSpectralFeature
from samplecore.spectral_distance import SpectralVectors
from samplecore.storage.curation import CURATION_SCHEMA
from samplecore.storage.repositories.sample import PostgresSampleRepository
from samplecore.storage.repositories.spectral import PostgresSampleSpectralFeatureRepository
from sampleserver.app import API_PREFIX, create_app
from tests.sampleserver.conftest import INFERENCE_URL, LOCAL_CLIENT, LOCAL_ORIGIN, LOCAL_SERVER

UNUSED_DATABASE_URL: Final[str] = "postgresql+psycopg://unused/unused"
READING_METHODS: Final[frozenset[str]] = frozenset({"GET", "HEAD"})
STARTUP_WAIT_SECONDS: Final[float] = 10.0
POLL_SECONDS: Final[float] = 0.05


def test_get_connection_opens_a_real_read_only_connection_to_the_configured_database(
    connection: Connection, _database_url: str, tmp_path: Path
) -> None:
    """Exercises `get_connection`'s real body -- opening the configured database read-only --
    rather than the dependency override every other test in this package uses. `connection` is
    depended on only for this test's isolation from others sharing the same database, not used
    directly: the schema it creates on first connect is already in place by the time this runs.
    """
    application = create_app(
        _database_url,
        tmp_path,
        INFERENCE_URL,
        role=ServiceRole.READER,
        server=LOCAL_SERVER,
        sample_directories=(),
        frontend_directory=None,
    )
    with TestClient(application, base_url=LOCAL_ORIGIN, client=LOCAL_CLIENT) as client:
        response = client.get(f"{API_PREFIX}/stats")

    assert response.status_code == 200
    assert response.json()["module_count"] == 0


def test_the_spectral_vectors_are_read_as_the_app_starts_and_serve_the_first_search(
    connection: Connection, _database_url: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    for sample_hash, vector in (("a" * 64, (0.0, 0.0)), ("b" * 64, (3.0, 4.0))):
        PostgresSampleRepository(connection).upsert(
            Sample(hash=sample_hash, depth=BitDepth.SIXTEEN, channels=ChannelLayout.MONO, frames=8)
        )
        PostgresSampleSpectralFeatureRepository(connection).upsert(
            SampleSpectralFeature(sample_hash=sample_hash, vector=vector, computed_at=datetime.now(UTC))
        )
    connection.commit()
    reads: list[SpectralVectors] = []
    read_vectors = PostgresSampleSpectralFeatureRepository.vectors

    def counted_read(repository: PostgresSampleSpectralFeatureRepository) -> SpectralVectors:
        reads.append(read_vectors(repository))
        return reads[-1]

    monkeypatch.setattr(PostgresSampleSpectralFeatureRepository, "vectors", counted_read)
    application = create_app(
        _database_url,
        tmp_path,
        INFERENCE_URL,
        role=ServiceRole.READER,
        server=LOCAL_SERVER,
        sample_directories=(),
        frontend_directory=None,
    )
    with TestClient(application, base_url=LOCAL_ORIGIN, client=LOCAL_CLIENT) as client:
        deadline = time.monotonic() + STARTUP_WAIT_SECONDS
        while not reads and time.monotonic() < deadline:
            time.sleep(POLL_SECONDS)
        response = client.get(f"{API_PREFIX}/samples/{'a' * 64}/similar")

    assert response.status_code == 200
    assert [neighbor["hash"] for neighbor in response.json()] == ["b" * 64]
    assert len(reads) == 1


def test_an_app_whose_catalog_is_unreachable_as_it_starts_still_starts(tmp_path: Path) -> None:
    application = create_app(
        UNUSED_DATABASE_URL,
        tmp_path,
        INFERENCE_URL,
        role=ServiceRole.READER,
        server=LOCAL_SERVER,
        sample_directories=(),
        frontend_directory=None,
    )
    with TestClient(application, base_url=LOCAL_ORIGIN, client=LOCAL_CLIENT) as client:
        response = client.get(f"{API_PREFIX}/curation/access")

    assert response.status_code == 200


def test_a_response_past_a_kilobyte_goes_out_gzipped_when_the_caller_accepts_it(
    connection: Connection, _database_url: str, tmp_path: Path
) -> None:
    """The cloud's payload is text that compresses several-fold, and every route shares the middleware."""
    with TestClient(
        create_app(
            _database_url,
            tmp_path,
            INFERENCE_URL,
            role=ServiceRole.READER,
            server=LOCAL_SERVER,
            sample_directories=(),
            frontend_directory=None,
        ),
        base_url=LOCAL_ORIGIN,
        client=LOCAL_CLIENT,
    ) as client:
        response = client.get(f"{API_PREFIX}/openapi.json", headers={"Accept-Encoding": "gzip"})

    assert response.headers["content-encoding"] == "gzip"
    assert "paths" in response.json()


def test_every_route_is_served_under_the_api_prefix(connection: Connection, _database_url: str, tmp_path: Path) -> None:
    """The API occupies one path segment of its own, leaving `/samples/{hash}` to the frontend.

    A single-page application routes `/samples/{hash}` in the browser, so a dev server forwarding
    that path to this API would answer a reload with JSON instead of the dashboard. Holding the
    whole API under one prefix is what keeps the two apart, which makes it worth pinning here
    rather than leaving it to the paths the other tests happen to name.
    """
    served = set(
        create_app(
            _database_url,
            tmp_path,
            INFERENCE_URL,
            role=ServiceRole.CURATOR,
            server=LOCAL_SERVER,
            sample_directories=(),
            frontend_directory=None,
        ).openapi()["paths"]
    )

    assert f"{API_PREFIX}/samples" in served
    assert f"{API_PREFIX}/curation/annotations/{{sample_hash}}" in served
    assert f"{API_PREFIX}/morph/audio" in served
    assert all(path.startswith(f"{API_PREFIX}/") for path in served)


def _writing_routes(role: ServiceRole, tmp_path: Path) -> set[tuple[str, str]]:
    application = create_app(
        UNUSED_DATABASE_URL,
        tmp_path,
        INFERENCE_URL,
        role=role,
        server=LOCAL_SERVER,
        sample_directories=(),
        frontend_directory=None,
    )
    return {
        (method.upper(), path)
        for path, operations in application.openapi()["paths"].items()
        for method in operations
        if method.upper() not in READING_METHODS
    }


def test_a_reader_serves_no_route_that_writes(tmp_path: Path) -> None:
    assert _writing_routes(ServiceRole.READER, tmp_path) == set()


def test_a_curator_writes_labels_alone(tmp_path: Path) -> None:
    assert _writing_routes(ServiceRole.CURATOR, tmp_path) == {
        ("PATCH", f"{API_PREFIX}/curation/annotations/{{sample_hash}}")
    }


def test_a_reader_refuses_a_label_change_and_says_so(client: TestClient) -> None:
    response = client.patch(f"/curation/annotations/{'a' * 64}", json={"scope": "sample", "rating": 3})

    assert response.status_code in (404, 405)
    assert client.get("/curation/access").json() == {"label_editing": False, "curation_shown": True}
