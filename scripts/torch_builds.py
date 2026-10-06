from __future__ import annotations

from typing import Final

PYPI_INDEX: Final[str] = "https://pypi.org/simple"
CPU_TORCH_INDEX: Final[str] = "https://download.pytorch.org/whl/cpu"
CUDA_TORCH_INDEX: Final[str] = "https://download.pytorch.org/whl/cu128"
# The NVIDIA launcher's wheel version carries this label ahead of its content digest, which keeps
# its installations apart from the processor launcher's: PyApp names the folder by the version.
CUDA_VARIANT: Final[str] = "cu128"
# The lowest CUDA version a driver reports for the NVIDIA launcher, which runs on any driver of the
# CUDA major version its torch build was made with.
MINIMUM_DRIVER_CUDA_MAJOR: Final[int] = 12
