from __future__ import annotations

from collections.abc import Sequence
from typing import Final

import numpy as np
from numpy.typing import NDArray

# Postgres's own `float4send` writes a single-precision value big-endian, so this byte order lets
# SQL build the same bytes the catalog's writers store.
VECTOR_DTYPE: Final = np.dtype(">f4")


def encode_vector(vector: Sequence[float]) -> bytes:
    """A vector as the catalog stores it: its values in single precision, one after another.

    Single precision holds everything the learned descriptor computes, which is itself single
    precision, at half the bytes to store, send and hold.
    """
    return np.asarray(vector, dtype=VECTOR_DTYPE).tobytes()


def decode_vector(stored: bytes) -> NDArray[np.float32]:
    """The values a stored vector holds, in this computer's own byte order."""
    return np.frombuffer(stored, dtype=VECTOR_DTYPE).astype(np.float32)
