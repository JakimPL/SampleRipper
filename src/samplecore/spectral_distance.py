from __future__ import annotations

from dataclasses import dataclass
from functools import cached_property

import numpy as np
from numpy.typing import NDArray


@dataclass(frozen=True)
class SpectralVectors:
    """Every embedded sample's standardized vector, as one matrix a search can sweep in one pass.

    ``hashes`` names the sample each row belongs to, in the matrix's own row order. Holding the
    vectors together rather than one per model is what lets a neighbor search measure a whole
    catalog at once, which is arithmetic a hundred thousand separate distance calls cannot reach.
    The matrix is single precision, as the catalog stores it, which halves what a served
    application holds for its searches.
    """

    hashes: tuple[str, ...]
    matrix: NDArray[np.float32]

    @cached_property
    def row_by_hash(self) -> dict[str, int]:
        """Which row of the matrix each sample's vector sits in."""
        return {sample_hash: row for row, sample_hash in enumerate(self.hashes)}

    @cached_property
    def squared_norms(self) -> NDArray[np.float64]:
        """Each row's squared length, summed in double precision, which every search from any sample reuses."""
        norms: NDArray[np.float64] = np.einsum("ij,ij->i", self.matrix, self.matrix, dtype=np.float64)
        return norms


def euclidean_distance(vector_a: tuple[float, ...], vector_b: tuple[float, ...]) -> float:
    """The straight-line distance between two standardized spectral feature vectors.

    Raises:
        ValueError: if the two vectors do not have the same length.
    """
    if len(vector_a) != len(vector_b):
        raise ValueError(f"vectors have different lengths: {len(vector_a)} != {len(vector_b)}")

    return float(np.linalg.norm(np.array(vector_a) - np.array(vector_b)))


def nearest_neighbors(target_hash: str, vectors: SpectralVectors, *, limit: int) -> tuple[tuple[str, float], ...]:
    """The ``limit`` sample hashes whose vector sits closest to ``target_hash``'s, nearest first.

    ``target_hash`` itself is excluded from its own neighbor list. A tied distance is broken by
    ascending hash, so the same inputs always resolve to the same ordering. Only the rows within
    the ``limit``-th distance are ordered, and the distances come from one product against the
    whole matrix, so a search costs one pass over the catalog. The product runs in the matrix's
    single precision and the distances are assembled from it in double precision, so the sweep
    copies nothing the size of the matrix.

    Raises:
        KeyError: if ``target_hash`` has no vector among these.
    """
    target_row = vectors.row_by_hash[target_hash]
    products = (vectors.matrix @ vectors.matrix[target_row]).astype(np.float64)
    squared = vectors.squared_norms - 2.0 * products + vectors.squared_norms[target_row]
    distances = np.sqrt(np.clip(squared, 0.0, None))
    distances[target_row] = np.inf
    kept = min(limit, len(vectors.hashes) - 1)
    if kept <= 0:
        return ()

    threshold = np.partition(distances, kept - 1)[kept - 1]
    candidates = np.flatnonzero(distances <= threshold).tolist()
    order = sorted(candidates, key=lambda row: (distances[row], vectors.hashes[row]))
    return tuple((vectors.hashes[row], float(distances[row])) for row in order[:kept])
