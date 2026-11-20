from __future__ import annotations

import time
from pathlib import Path
from typing import Final

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Connection

from samplecore.models.service_role import ServiceRole
from sampleserver import memory
from sampleserver.app import create_app
from tests.sampleserver.conftest import INFERENCE_URL, LOCAL_CLIENT, LOCAL_ORIGIN, LOCAL_SERVER

TEST_INTERVAL_SECONDS: Final[float] = 0.01
WAIT_SECONDS: Final[float] = 10.0
POLL_SECONDS: Final[float] = 0.01


def test_a_serving_app_hands_its_freed_memory_back_until_it_stops(
    connection: Connection, _database_url: str, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    releases: list[int] = []
    monkeypatch.setattr(memory, "FREE_MEMORY_INTERVAL_SECONDS", TEST_INTERVAL_SECONDS)
    monkeypatch.setattr(memory, "release_free_memory", lambda: releases.append(1))
    application = create_app(
        _database_url,
        tmp_path,
        INFERENCE_URL,
        role=ServiceRole.READER,
        server=LOCAL_SERVER,
        sample_directories=(),
        frontend_directory=None,
    )

    with TestClient(application, base_url=LOCAL_ORIGIN, client=LOCAL_CLIENT):
        deadline = time.monotonic() + WAIT_SECONDS
        while len(releases) < 2 and time.monotonic() < deadline:
            time.sleep(POLL_SECONDS)
    released_while_serving = len(releases)
    time.sleep(TEST_INTERVAL_SECONDS * 5)

    assert released_while_serving >= 2
    assert len(releases) == released_while_serving
