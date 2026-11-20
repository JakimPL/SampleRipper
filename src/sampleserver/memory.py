from __future__ import annotations

from typing import Final

import anyio

from samplecore.allocator import release_free_memory

FREE_MEMORY_INTERVAL_SECONDS: Final[float] = 30.0


async def release_free_memory_periodically() -> None:
    """Hand what the server has freed back to the system every `FREE_MEMORY_INTERVAL_SECONDS`, for as long as it runs.

    A whole-catalog answer is built from hundreds of megabytes of rows and models that are freed
    once its bytes are cached, and many routes build smaller ones of the same kind; releasing on a
    timer covers every one of them. The release runs on a worker thread, so the event loop keeps
    answering while it walks the allocator.
    """
    while True:
        await anyio.sleep(FREE_MEMORY_INTERVAL_SECONDS)
        await anyio.to_thread.run_sync(release_free_memory)
