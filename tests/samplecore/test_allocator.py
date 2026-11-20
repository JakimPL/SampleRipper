from __future__ import annotations

import ctypes.util
from collections.abc import Iterator

import pytest

from samplecore import allocator
from samplecore.allocator import release_free_memory


@pytest.fixture
def fresh_probe() -> Iterator[None]:
    """The C library looked up afresh, for a test that changes what the lookup finds."""
    allocator._malloc_trim.cache_clear()  # pylint: disable=protected-access
    yield
    allocator._malloc_trim.cache_clear()  # pylint: disable=protected-access


def test_freed_memory_is_released_through_this_systems_own_c_library(fresh_probe: None) -> None:
    release_free_memory()


def test_a_system_naming_no_c_library_keeps_what_its_allocator_keeps(
    fresh_probe: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(ctypes.util, "find_library", lambda _name: None)

    release_free_memory()

    assert allocator._malloc_trim() is None  # pylint: disable=protected-access
