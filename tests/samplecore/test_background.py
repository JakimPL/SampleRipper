from __future__ import annotations

import asyncio
import logging
from contextlib import AbstractAsyncContextManager

import pytest

from samplecore import background
from samplecore.background import running_beside


class _Ticking:
    """A piece of work that counts its turns until it is canceled."""

    def __init__(self) -> None:
        self.turns = 0
        self.canceled = False

    async def __call__(self) -> None:
        try:
            while True:
                self.turns += 1
                await asyncio.sleep(0)
        except asyncio.CancelledError:
            self.canceled = True
            raise


async def _failing() -> None:
    raise LookupError("the work broke")


def test_work_runs_while_the_block_lasts_and_is_canceled_as_it_ends() -> None:
    ticking = _Ticking()

    async def scenario() -> None:
        async with running_beside(ticking):
            while ticking.turns < 3:
                await asyncio.sleep(0)

    asyncio.run(scenario())

    assert ticking.turns >= 3
    assert ticking.canceled


def test_a_block_entered_in_one_task_ends_in_another() -> None:
    """The SampleRipper app opens a library's server in one task and closes it in another."""
    ticking = _Ticking()

    async def scenario() -> None:
        block: AbstractAsyncContextManager[None] = running_beside(ticking)
        await asyncio.create_task(block.__aenter__())
        await asyncio.sleep(0)
        await asyncio.create_task(block.__aexit__(None, None, None))

    asyncio.run(scenario())

    assert ticking.canceled


def test_work_that_fails_is_logged_and_the_block_still_ends_cleanly(caplog: pytest.LogCaptureFixture) -> None:
    """A server closing after its work failed still closes everything after it."""
    closed: list[bool] = []

    async def scenario() -> None:
        async with running_beside(_failing):
            await asyncio.sleep(0)
            await asyncio.sleep(0)
        closed.append(True)

    with caplog.at_level(logging.ERROR, logger=background.__name__):
        asyncio.run(scenario())

    assert closed == [True]
    assert any("the work broke" in str(record.exc_info[1]) for record in caplog.records if record.exc_info)
