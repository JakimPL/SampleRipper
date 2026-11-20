from __future__ import annotations

import logging
from datetime import datetime
from threading import Lock

import anyio
from sqlalchemy import Connection
from sqlalchemy.exc import DBAPIError

from samplecore.spectral_distance import SpectralVectors
from samplecore.storage.repositories.spectral import PostgresSampleSpectralFeatureRepository
from sampleserver.connections import CatalogConnections
from sampleserver.messages import SPECTRAL_VECTORS_UNREAD

_Revision = tuple[int, datetime | None]

_logger = logging.getLogger(__name__)


class SpectralVectorCache:
    """One parsed copy of the catalog's spectral vectors, held for as long as it describes it.

    Every nearest-neighbor search measures the whole catalog, and reading those vectors back means
    a quarter of a gigabyte from the catalog -- seconds of work, repeated per request, for an
    answer that changes only when an embedding pass runs. Keeping the matrix and checking a
    two-number revision against the table before each use turns that into one cheap query, while
    an embedding run that replaces the rows is picked up on the next request. The app reads it once
    as it starts (`load`), so the first search finds it in memory.

    Held per application rather than per module, so a test's own app starts with nothing cached, and
    guarded by a lock because a request arrives on whichever worker thread is free; a search
    arriving while the vectors are read waits for them.
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._revision: _Revision | None = None
        self._vectors: SpectralVectors | None = None

    def vectors(self, connection: Connection) -> SpectralVectors:
        """The catalog's vectors as one matrix, read afresh whenever the stored rows have moved on.

        The copy being replaced is let go before the new one is read, so a catalog's vectors are
        held once.
        """
        repository = PostgresSampleSpectralFeatureRepository(connection)
        revision = repository.revision()
        with self._lock:
            if self._vectors is None or self._revision != revision:
                self._vectors = None
                self._vectors = repository.vectors()
                self._revision = revision

            return self._vectors

    async def load(self, connections: CatalogConnections) -> None:
        """Read the vectors through one of the app's connections, for an app about to serve its first search.

        A catalog unreachable at that moment leaves the cache empty, and the first search reads the
        vectors itself.
        """
        try:
            async with connections.read_only() as connection:
                await anyio.to_thread.run_sync(self.vectors, connection)
        except DBAPIError as error:
            _logger.warning("%s", SPECTRAL_VECTORS_UNREAD.format(reason=error.orig))
