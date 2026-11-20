from __future__ import annotations

import ctypes
import ctypes.util
from collections.abc import Callable
from functools import cache


def release_free_memory() -> None:
    """Hand the memory this process has freed back to the system, so its footprint follows what it holds.

    A long-lived process that builds a large answer and lets it go keeps the freed blocks inside
    glibc's allocator, ready for reuse but still counted against the process, and a hosting platform
    bills what is counted. `malloc_trim` returns every whole free page to the system; it takes a few
    milliseconds, which is why a server calls it after large pieces of work rather than after
    every allocation. On a C library offering no such call (macOS, Windows, musl) the call returns
    at once, the allocator there managing its own pages.
    """
    trim = _malloc_trim()
    if trim is not None:
        trim(0)


@cache
def _malloc_trim() -> Callable[[int], int] | None:
    """glibc's `malloc_trim(pad)`, which returns 1 when it gave memory back, where this process's C library offers it."""
    name = ctypes.util.find_library("c")
    if name is None:
        return None
    library = ctypes.CDLL(name)
    try:
        trim = library.malloc_trim
    except AttributeError:
        return None
    trim.argtypes = [ctypes.c_size_t]
    trim.restype = ctypes.c_int
    release: Callable[[int], int] = trim
    return release
