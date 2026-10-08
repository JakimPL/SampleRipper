from __future__ import annotations

from typing import Final

# What `sampleripper publish` tells the person publishing, each a sentence of its own.

NO_TARGET: Final[str] = (
    "Set SAMPLERIPPER_PUBLISH_DATABASE_URL to the database you want to publish to, such as the public "
    "URL of your site's Postgres. Its user must be allowed to create roles and tables."
)
UNKNOWN_DRIVER: Final[str] = "SAMPLERIPPER_PUBLISH_DATABASE_URL uses an unsupported database type: {name}."
SERVER_IN_SETTINGS: Final[str] = (
    "SAMPLERIPPER_PUBLISH_DATABASE_URL gives the server in a {name}= setting. Put the server in "
    "the address itself, before the database name."
)
WEAK_TRANSPORT: Final[str] = (
    "Publishing to {host} goes over the internet, so the connection needs sslmode=require or " "stricter, not {mode}."
)
NO_READER_PASSWORD: Final[str] = (
    "Set SAMPLERIPPER_PUBLISH_READER_PASSWORD to the reader password your site uses, the same "
    "one that is in its SAMPLERIPPER_SERVER_DATABASE_URL."
)
NOT_A_PUBLICATION: Final[str] = (
    "The database already holds a catalog that SampleRipper did not publish. Publishing replaces "
    "everything in it, so choose an empty database or one you published to before."
)
OWN_VOCABULARY: Final[str] = (
    "The categories were scored with your own vocabulary, which may contain the wording of your "
    "labels. Score them again with the built-in one before publishing: "
    "sampleripper cloud categorize --vocabulary instruments."
)
MISSING_OBJECTS: Final[str] = (
    "{count} samples have no stored audio, starting with {first}. The library's audio store is "
    "damaged; extract the modules again before publishing."
)
CURATION_REACHED: Final[str] = (
    "Publishing would include rows of {table}, which must stay on this computer. Nothing was published."
)
PRIVATE_VALUE: Final[str] = (
    "{table}.{column} contains a path on this computer, which must not be published. Nothing was " "published."
)
READER_REFUSED: Final[str] = "The site's reader can't log in: {problem}"
PUBLISHED: Final[str] = (
    "Published {samples} samples to {server}. {unreadable} samples were left out because their files could not be read."
)
AUDIO_READY: Final[str] = "The site's audio is in {path}: {files} files, {size}."
NEXT_STEPS: Final[str] = (
    "Next: turn off the database's TCP Proxy and redeploy the site. If your samples changed, also upload "
    "the audio files from that folder to the site's volume. docs/deploying.md has the commands."
)
