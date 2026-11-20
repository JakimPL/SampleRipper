from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator, Callable, Coroutine
from contextlib import asynccontextmanager
from functools import partial

from samplecore.messages import BACKGROUND_WORK_FAILED

_logger = logging.getLogger(__name__)


@asynccontextmanager
async def running_beside(*work: Callable[[], Coroutine[None, None, None]]) -> AsyncIterator[None]:
    """Run each piece of ``work`` on the event loop for as long as the block lasts, then cancel what is left of it.

    The SampleRipper app opens a library's server in one task and closes it in another, so the work
    runs as tasks of the loop itself, which any task may cancel; a task group belongs to the task
    that opened it. A piece of work that fails is logged the moment it does, and the block always
    ends cleanly, so whatever closes after it -- a database, a renderer -- closes too.
    """
    tasks = [asyncio.create_task(piece()) for piece in work]
    for task, piece in zip(tasks, work, strict=True):
        task.add_done_callback(partial(_log_failure, work=repr(piece)))
    try:
        yield
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


def _log_failure(task: asyncio.Task[None], *, work: str) -> None:
    if task.cancelled():
        return
    failure = task.exception()
    if failure is not None:
        _logger.error("%s", BACKGROUND_WORK_FAILED.format(work=work), exc_info=failure)
