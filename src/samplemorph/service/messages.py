from __future__ import annotations

from typing import Final

# What the renderer's commands say in their log, each a sentence the person running them reads.

RENDERER_COMPILED: Final[str] = (
    "The renderer is compiled and its code is saved, so a renderer started later with the same cache "
    "folder starts in seconds."
)
SERVING_NOTHING: Final[str] = "Serving nothing: {reason}."
WARMING_NOTHING: Final[str] = "Warming nothing: {reason}."
