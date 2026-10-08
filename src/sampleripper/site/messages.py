from __future__ import annotations

from typing import Final

# What `sampleripper site` says as it refuses to start, or as it starts, each a sentence the person deploying reads.

NOT_PUBLIC: Final[str] = (
    'A site is open to anyone. Set exposure = "public" under [server] and set its limits under ' "[server.visitors]."
)
NO_PORT: Final[str] = (
    "Set the $PORT environment variable to the port the site should listen on. Hosting platforms do this for you."
)
BAD_PORT: Final[str] = "$PORT isn't a valid port: {value!r}."
NO_READER: Final[str] = "Set SAMPLERIPPER_SERVER_DATABASE_URL to connect as the reader role that publishing creates."
WEAK_READER_PASSWORD: Final[str] = "The reader password is shorter than {length} characters. Use a generated one."
NO_READER_HOST: Final[str] = (
    "SAMPLERIPPER_SERVER_DATABASE_URL has no database host. Put the database's private host between "
    "the @ and the port. A reference to another service works only under that service's own name."
)
CATALOG_UNREACHABLE: Final[str] = (
    "Could not reach the catalog at the address in SAMPLERIPPER_SERVER_DATABASE_URL: {reason}. "
    "Check the host and the database name, and make sure the database is running."
)
CREDENTIAL_BEYOND_READER: Final[str] = (
    "{name} gives access that can change the catalog, which a site must not have. Remove it "
    "from the site's configuration."
)
RENDERER_BEYOND_THIS_COMPUTER: Final[str] = (
    "The morph renderer of a site must listen on this computer only. Set [inference] url to a loopback address, such as 127.0.0.1."
)
PORT_TAKEN_BY_RENDERER: Final[str] = (
    "$PORT is the port the morph renderer uses. Set a different port in [inference] url."
)
UNREADABLE_AUDIO_STORE: Final[str] = (
    "The site can't read its audio folder at {path}. Give the site's user access to it."
)
NO_AUDIO: Final[str] = (
    "The site found no audio at {path}, so no sample can play yet. Upload the published audio files "
    "there; samples play as soon as they arrive."
)
RENDERER_DID_NOT_START: Final[str] = "The morph renderer didn't start within {seconds:g} seconds."
RENDERER_ENDED_AT_START: Final[str] = "The morph renderer stopped right after starting. Its output above shows why."
RENDERER_ENDED: Final[str] = "The morph renderer stopped with status {status}, so the site is stopping too."
