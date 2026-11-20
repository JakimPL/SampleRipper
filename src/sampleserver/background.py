from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Callable, Coroutine
from contextlib import asynccontextmanager


@asynccontextmanager
async def running_beside(*work: Callable[[], Coroutine[None, None, None]]) -> AsyncIterator[None]:
    """Run each piece of ``work`` on the event loop for as long as the block lasts, then cancel what is left of it.

    The SampleRipper app opens a library's server in one task and closes it in another, so the work
    runs as tasks of the loop itself, which any task may cancel; a task group belongs to the task
    that opened it. A piece of work that failed raises its error as the block ends.
    """
    tasks = [asyncio.create_task(piece()) for piece in work]
    try:
        yield
    finally:
        for task in tasks:
            task.cancel()
        outcomes = await asyncio.gather(*tasks, return_exceptions=True)
        for outcome in outcomes:
            if isinstance(outcome, Exception):
                raise outcome
