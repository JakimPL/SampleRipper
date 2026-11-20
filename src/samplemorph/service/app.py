from __future__ import annotations

import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from functools import partial
from typing import Final

import anyio
from fastapi import FastAPI

from samplecore.background import running_beside
from samplemorph.service.callers import ProgramsCallingItsAddressOnly
from samplemorph.service.renderer import MorphRenderer
from samplemorph.service.routes import router

IDLE_CHECK_SECONDS: Final[float] = 60.0


def create_app(renderer: MorphRenderer, *, host: str) -> FastAPI:
    """Build the inference app around a renderer already loaded and warmed, answering calls to ``host`` from programs.

    The route is built and warmed once, before the app exists, into the renderer every request
    shares, so the first morph costs what any later one does. The app answers the catalog API and
    a sampler calling it by the address it listens on, or by a loopback name, and no web page
    (`samplemorph.service.callers`). While it runs, it asks the renderer every `IDLE_CHECK_SECONDS`
    whether it has been quiet long enough to empty its caches. A pure factory, so a test builds one
    over a renderer loaded from a temporary library root.
    """

    @asynccontextmanager
    async def lifespan(_application: FastAPI) -> AsyncIterator[None]:
        async with running_beside(partial(release_when_idle_periodically, renderer)):
            yield

    application = FastAPI(
        title="SampleRipper morph inference",
        description="Morphs between two samples of the catalog, rendered through the envelope route.",
        lifespan=lifespan,
    )
    application.add_middleware(ProgramsCallingItsAddressOnly, host=host)
    application.state.renderer = renderer
    application.include_router(router)
    return application


async def release_when_idle_periodically(renderer: MorphRenderer) -> None:
    """Ask ``renderer`` every `IDLE_CHECK_SECONDS` to empty its caches if it has been quiet, on a worker thread."""
    while True:
        await anyio.sleep(IDLE_CHECK_SECONDS)
        await anyio.to_thread.run_sync(partial(renderer.release_when_idle, now=time.monotonic()))
