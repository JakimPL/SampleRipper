from __future__ import annotations

import importlib.util
import json
import sys
import types
from collections.abc import Iterator
from contextlib import closing
from datetime import UTC, datetime
from typing import Final

import numpy as np
import pytest
from sqlalchemy import Connection, text
from trackmod.core.samples.depth import BitDepth

from samplecore.models.channels import ChannelLayout
from samplecore.models.sample import Sample
from samplecore.storage.database import connect
from samplecore.storage.repositories.sample import PostgresSampleRepository
from samplecore.storage.repositories.spectral import PostgresSampleSpectralFeatureRepository
from tests.paths import MIGRATE_SPECTRAL_VECTORS_SCRIPT

SAMPLE_HASH: Final[str] = "a" * 64
STORED_TEXT_VECTOR: Final[tuple[float, ...]] = (0.1, -2.5, 3.0e-7, 1234.5678)


def _load_script() -> types.ModuleType:
    """Imports the script by file path -- it lives outside every installed package, by design."""
    spec = importlib.util.spec_from_file_location("migrate_spectral_vectors", MIGRATE_SPECTRAL_VECTORS_SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


migrate_spectral_vectors = _load_script()


@pytest.fixture
def catalog_storing_text(fresh_database_url: str) -> Iterator[Connection]:
    """A catalog whose spectral vectors are JSON text, as a library written before single precision holds them."""
    with closing(connect(fresh_database_url)) as connection:
        connection.execute(text("ALTER TABLE sample_spectral_feature ALTER COLUMN vector TYPE varchar"))
        PostgresSampleRepository(connection).upsert(
            Sample(hash=SAMPLE_HASH, depth=BitDepth.SIXTEEN, channels=ChannelLayout.MONO, frames=8)
        )
        connection.execute(
            text("INSERT INTO sample_spectral_feature (sample_hash, vector, computed_at) VALUES (:hash, :vector, :at)"),
            {"hash": SAMPLE_HASH, "vector": json.dumps(STORED_TEXT_VECTOR), "at": datetime.now(UTC)},
        )
        connection.commit()
        yield connection


def test_a_vector_stored_as_text_keeps_its_values_in_single_precision(catalog_storing_text: Connection) -> None:
    assert migrate_spectral_vectors.migrate_spectral_vectors(catalog_storing_text)

    stored = PostgresSampleSpectralFeatureRepository(catalog_storing_text).get(SAMPLE_HASH)

    assert stored is not None
    assert stored.vector == tuple(np.asarray(STORED_TEXT_VECTOR, dtype=np.float32).tolist())


def test_the_converted_column_keeps_its_vectors_out_of_line(catalog_storing_text: Connection) -> None:
    migrate_spectral_vectors.migrate_spectral_vectors(catalog_storing_text)

    storage = catalog_storing_text.execute(
        text(
            "SELECT attstorage FROM pg_attribute "
            "WHERE attrelid = 'sample_spectral_feature'::regclass AND attname = 'vector'"
        )
    ).scalar_one()

    assert storage == "e"


def test_converting_again_changes_nothing(catalog_storing_text: Connection) -> None:
    migrate_spectral_vectors.migrate_spectral_vectors(catalog_storing_text)

    assert not migrate_spectral_vectors.migrate_spectral_vectors(catalog_storing_text)
    assert PostgresSampleSpectralFeatureRepository(catalog_storing_text).vectors().hashes == (SAMPLE_HASH,)
