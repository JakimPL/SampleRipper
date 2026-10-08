from __future__ import annotations

from typing import Final

# What `sampleripper serve` says as it refuses a config, each a sentence the person running it reads.

SERVE_REFUSES_PUBLIC: Final[str] = (
    "This config would serve the library to anyone on the internet. Use `sampleripper site` for "
    "that; it adds the morph renderer and the visitor limits."
)
HOST_BEYOND_EXPOSURE: Final[str] = (
    "This config serves the library on this computer only, so it listens on 127.0.0.1. To let other devices "
    'on your network open it, set exposure = "network" under [server].'
)
