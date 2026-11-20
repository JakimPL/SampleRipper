from __future__ import annotations

import argparse
import os
import sys
from contextlib import closing
from typing import Final

from sqlalchemy import Connection, LargeBinary, inspect, text

from samplecore.cli_support import load_config_or_exit
from samplecore.storage.database import SPECTRAL_VECTOR_STORAGE, connect, sample_spectral_feature, start_batch
from sampleripper.publish.target import PublishRefusedError, target_engine, target_url

# Each stored text is a JSON list; its values, read in order as single precision, are sent the way
# Postgres sends a `real`, big-endian, which is the byte order `samplecore.storage.vector_bytes` reads.
CONVERSION_FUNCTION: Final[str] = """
CREATE FUNCTION pg_temp.spectral_vector_bytes(vector text) RETURNS bytea LANGUAGE sql IMMUTABLE AS $$
    SELECT coalesce(string_agg(float4send(item.element::real), ''::bytea ORDER BY item.position), ''::bytea)
    FROM json_array_elements_text(vector::json) WITH ORDINALITY AS item(element, position)
$$
"""
CONVERSION: Final[str] = (
    f"ALTER TABLE {sample_spectral_feature.name} ALTER COLUMN vector TYPE bytea "
    "USING pg_temp.spectral_vector_bytes(vector)"
)
CONVERTED: Final[str] = "The spectral vectors in {database} are now stored as single-precision values."
ALREADY_CONVERTED: Final[str] = "The spectral vectors in {database} were already stored as single-precision values."
THE_LIBRARY: Final[str] = "your library"
THE_PUBLICATION: Final[str] = "the site's database"


def migrate_spectral_vectors(connection: Connection) -> bool:
    """Bring a catalog's spectral vectors from JSON text to the single-precision bytes they are stored as now.

    Every vector keeps its values, rounded to single precision, and the column keeps them out of
    line the way a fresh catalog creates it. The whole of it is one transaction, and a catalog
    already holding bytes is left as it is, so running it again changes nothing. Returns whether
    the vectors were converted.
    """
    with start_batch(connection):
        if _stores_bytes(connection):
            return False
        connection.execute(text(CONVERSION_FUNCTION))
        connection.execute(text(CONVERSION))
        connection.execute(SPECTRAL_VECTOR_STORAGE)
    return True


def _stores_bytes(connection: Connection) -> bool:
    columns = inspect(connection).get_columns(sample_spectral_feature.name)
    vector_type = next(column["type"] for column in columns if column["name"] == "vector")
    return isinstance(vector_type, LargeBinary)


def _publication_connection() -> Connection:
    """A connection to the site's database ``SAMPLERIPPER_PUBLISH_DATABASE_URL`` names, as `sampleripper publish` opens it.

    Raises:
        SystemExit: the variable is missing or names the database in a way a publication refuses.
    """
    try:
        url = target_url(os.environ)
    except PublishRefusedError as refusal:
        sys.exit(" ".join(refusal.problems))
    return target_engine(url).connect()


def main(argv: list[str]) -> None:
    """Convert the spectral vectors of the library ``SAMPLERIPPER_CONFIG`` or ``config.toml`` names, or of a site's database."""
    parser = argparse.ArgumentParser(description="Store a catalog's spectral vectors as single-precision values.")
    parser.add_argument(
        "--publication",
        action="store_true",
        help="Convert the site's database SAMPLERIPPER_PUBLISH_DATABASE_URL names, in place of your library.",
    )
    arguments = parser.parse_args(argv)
    if arguments.publication:
        database = THE_PUBLICATION
        connection = _publication_connection()
    else:
        database = THE_LIBRARY
        connection = connect(load_config_or_exit().catalog_url())
    with closing(connection):
        converted = migrate_spectral_vectors(connection)
    print((CONVERTED if converted else ALREADY_CONVERTED).format(database=database))


if __name__ == "__main__":
    main(sys.argv[1:])
