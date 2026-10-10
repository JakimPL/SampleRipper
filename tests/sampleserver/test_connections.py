from __future__ import annotations

from collections.abc import Iterator
from contextlib import AsyncExitStack
from typing import Final

import anyio
import pytest
from sqlalchemy import Connection, Engine

from samplecore.storage.database import create_pooled_engine
from sampleserver.connections import CURATION_CONNECTIONS, CatalogConnections

READING_PLACES: Final[int] = 2
CAPACITY: Final[int] = READING_PLACES + CURATION_CONNECTIONS
WAITING_READ: Final[str] = "the waiting read"
WRITE: Final[str] = "a write"
READS_RETURNED: Final[str] = "the held reads returned"


@pytest.fixture
def engine(connection: Connection, _database_url: str) -> Iterator[Engine]:
    pooled = create_pooled_engine(_database_url, pool_size=1)
    yield pooled
    pooled.dispose()


@pytest.fixture
def connections(engine: Engine) -> CatalogConnections:
    return CatalogConnections(engine, capacity=CAPACITY)


def test_a_read_past_the_reading_places_waits_for_one_to_come_back_while_a_write_has_its_own(
    connections: CatalogConnections,
) -> None:
    async def scenario() -> list[str]:
        events: list[str] = []

        async def read() -> None:
            async with connections.read_only():
                events.append(WAITING_READ)

        async with anyio.create_task_group() as group:
            async with AsyncExitStack() as held:
                for _ in range(READING_PLACES):
                    await held.enter_async_context(connections.read_only())
                group.start_soon(read)
                await anyio.wait_all_tasks_blocked()
                async with connections.writable():
                    events.append(WRITE)
                events.append(READS_RETURNED)
        return events

    assert anyio.run(scenario) == [WRITE, READS_RETURNED, WAITING_READ]


def test_a_request_canceled_while_it_reads_returns_its_connection_to_the_pool(
    connections: CatalogConnections, engine: Engine
) -> None:
    async def scenario() -> int:
        holding = anyio.Event()

        async def read_until_canceled() -> None:
            async with connections.read_only():
                holding.set()
                await anyio.sleep_forever()

        async with anyio.create_task_group() as group:
            group.start_soon(read_until_canceled)
            await holding.wait()
            group.cancel_scope.cancel()
        return engine.pool.checkedout()

    assert anyio.run(scenario) == 0
