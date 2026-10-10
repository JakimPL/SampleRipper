from __future__ import annotations

from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from typing import Final

import anyio
from anyio import CancelScope, CapacityLimiter, Semaphore
from sqlalchemy import Connection, Engine

from samplecore.storage.database import checkout_read_only

CURATION_CONNECTIONS: Final[int] = 1


class CatalogConnections:
    """The gate every request passes on its way to one of the catalog's pooled connections.

    A request waits its turn on the event loop and is admitted while the pool has a connection free
    for it, `capacity` requests at most, so every checkout finds a connection at once and a worker
    thread running a request's work holds a connection already checked out, running to the end. A
    burst of requests larger than the thread pool queues here and is answered in turn, each
    connection passing to the next request as it comes back, which keeps every worker thread free
    for the work of the requests already admitted.

    A label write reads the catalog and writes the curation schema at once, holding one connection of
    each kind, so the writable connections have `CURATION_CONNECTIONS` places of their own beside the
    read-only ones, and a write waiting for its second connection waits on other writes alone.
    Checkouts and returns run on worker threads counted apart from the shared thread pool, one per
    connection the pool holds, so an admitted request reaches its connection at once.
    """

    def __init__(self, engine: Engine, *, capacity: int) -> None:
        self._engine = engine
        self._reading = Semaphore(capacity - CURATION_CONNECTIONS)
        self._curating = Semaphore(CURATION_CONNECTIONS)
        self._checkouts = CapacityLimiter(capacity)

    @asynccontextmanager
    async def read_only(self) -> AsyncIterator[Connection]:
        """A connection whose transaction Postgres refuses a write on, back in the pool as the block ends."""
        async with self._reading, self._checked_out(checkout_read_only) as connection:
            yield connection

    @asynccontextmanager
    async def writable(self) -> AsyncIterator[Connection]:
        """A connection that may write the curation schema, back in the pool as the block ends."""
        async with self._curating, self._checked_out(Engine.connect) as connection:
            yield connection

    @asynccontextmanager
    async def _checked_out(self, checkout: Callable[[Engine], Connection]) -> AsyncIterator[Connection]:
        """A connection checked out by ``checkout``, returned to the pool even when the request is canceled."""
        connection = await anyio.to_thread.run_sync(checkout, self._engine, limiter=self._checkouts)
        try:
            yield connection
        finally:
            with CancelScope(shield=True):
                await anyio.to_thread.run_sync(connection.close, limiter=self._checkouts)
