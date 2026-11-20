from __future__ import annotations

from functools import cache
from typing import Final, Protocol

import librosa
import numba
import numpy as np
from numpy.typing import NDArray

from samplemorph.geometry import LogFrequencyGeometry, analysis_taper
from samplemorph.vocoders.levels import floor_level, peak_level

PGHI_TOLERANCE: Final[float] = 1e-6
MISSING_EXTRA_MESSAGE: Final[str] = (
    "pghipy is not installed. Install the 'morph' extra (uv sync --extra morph) to estimate phase by "
    "gradient heap integration."
)


class _PhaseIntegrator(Protocol):
    # pghipy.pghi reads a magnitude shaped (frames, bins) with the analysis length, its hop, the
    # Gaussian's gamma and the relative level below which a bin is left out, and returns a phase of
    # the same shape; pghipy ships no type stubs, so the contract is stated here.
    def __call__(
        self, magnitude: NDArray[np.float64], *, win_length: int, hop_length: int, gamma: float, tol: float
    ) -> NDArray[np.float64]: ...


@cache
def _integrator() -> _PhaseIntegrator:
    """pghipy's integrator, compiled with its machine code kept in numba's cache.

    pghipy compiles its integrator afresh in every process, which takes a renderer more than ten
    seconds to start; compiled again from its own Python function with the cache on, a process
    whose cache already holds it loads it in a fraction of a second.
    """
    try:
        # pylint: disable=import-outside-toplevel
        from pghipy import pghi
    except ImportError as error:
        raise ImportError(MISSING_EXTRA_MESSAGE) from error

    integrator: _PhaseIntegrator = numba.njit(cache=True)(pghi.py_func)
    return integrator


def integrate_and_synthesize(
    magnitude: NDArray[np.floating], *, geometry: LogFrequencyGeometry, frame_count: int
) -> NDArray[np.float64]:
    """Integrate a phase for a linear Fourier magnitude and return the `frame_count` frames it makes audible.

    The integration reads the gradient of the log magnitude, so the magnitude is held at the
    grid's own dynamic range below its peak: every bin then carries a finite gradient, and the
    depth under which the integration reads silence is the depth the canonical image already
    imposed.
    """
    floor = floor_level(peak_level(magnitude), dynamic_range_db=geometry.dynamic_range_db)
    # pghipy accumulates the phase in an array of the magnitude's own type, and a long render's phase
    # outgrows what single precision resolves on high partials.
    frames_first = np.ascontiguousarray(np.maximum(magnitude, floor).T, dtype=np.float64)
    phase = _integrator()(
        frames_first,
        win_length=geometry.fft_length,
        hop_length=geometry.hop_length,
        gamma=geometry.phase_gradient_spread,
        tol=PGHI_TOLERANCE,
    )
    waveform: NDArray[np.float64] = librosa.istft(
        (frames_first * np.exp(1j * phase)).T,
        hop_length=geometry.hop_length,
        n_fft=geometry.fft_length,
        window=analysis_taper(geometry),
        length=frame_count,
    )
    return waveform
