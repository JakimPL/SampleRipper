from __future__ import annotations

from typing import Final

# What `sampleripper app` tells the person starting or quitting it, each a sentence of its own.

DESCRIPTION: Final[str] = "Run SampleRipper with its setup pages, opened in a browser."
PORT_HELP: Final[str] = (
    "The port to listen on. Left out, SampleRipper keeps the port it listened on last, or finds a free one."
)
FRONTEND_HELP: Final[str] = "A built frontend to serve instead of the bundled one."
BROWSER_HELP: Final[str] = "Open the application in the default browser on start."
QUIT_HELP: Final[str] = "Quit the SampleRipper running under this config, and wait until it has ended."
ALREADY_RUNNING: Final[str] = "SampleRipper is already running at {address}. Opening it."
CLOSED: Final[str] = "SampleRipper is closed."
RUNNING: Final[str] = "SampleRipper is running at {address}. Press Ctrl+C or click Quit to stop it."
PORT_TAKEN: Final[str] = "{error} Leave --port out to let SampleRipper choose a port."
NO_FRONTEND: Final[str] = "No built frontend found. Run `just frontend-build` first."
HOLDER_SILENT: Final[str] = "Another start of SampleRipper holds {lock} without saying where it runs."
HOLDER_STUCK: Final[str] = "SampleRipper kept running after it was closed. Restart the computer, then try again."
LIBRARY_OPEN_FAILED: Final[str] = "Could not open the library: %s"
LIBRARY_OPEN: Final[str] = "The library at %s is open."
