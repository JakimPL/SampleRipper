from __future__ import annotations

from typing import Final

# What the config file's readers tell the person who edits it, each a sentence of its own.

INFERENCE_URL_SCHEME: Final[str] = "{url} must use {scheme}://, as in {example}"
INFERENCE_URL_ROOT: Final[str] = "{url} must name the process's root, as in {example}"
INFERENCE_URL_NO_HOST: Final[str] = "{url} names no host, as in {example}"
INFERENCE_URL_NO_PORT: Final[str] = "{url} names no port, as in {example}"
VISITOR_LIMITS_MISSING: Final[str] = "a library open to anyone needs visitor limits under [server.visitors]"
VISITOR_LIMITS_UNUSED: Final[str] = (
    '[server.visitors] applies only to a library open to anyone; set exposure = "public" or remove it'
)
FOLDER_NOT_ABSOLUTE: Final[str] = "{directory} must be an absolute path"
FOLDERS_OVERLAP: Final[str] = "{directory} and {other} overlap. Choose each folder only once."
PUBLISHED_FOLDER_UNKNOWN: Final[str] = "{directory} under [publish] isn't one of the library's sample_directories"
PUBLISHED_FOLDER_NAMES_REPEAT: Final[str] = "the sample directories a site shows must have different folder names"
EXCLUSION_EMPTY: Final[str] = "an exclusion must be a pattern such as *loop*"
DATABASE_URL_UNPARSABLE: Final[str] = "must be a URL such as {example}"
SERVICE_ROLE_UNCONFIGURED: Final[str] = (
    "The config names no {setting}, the role a served {service} connects as. Set it in the [{table}] table, "
    "then run `sampleripper setup database` to create the role."
)
NO_CONFIG_FILE: Final[str] = (
    "No config file at {path}. Run `sampleripper setup config` to put one there, or copy "
    "config.example.toml to config.toml yourself, and fill in your paths."
)
NO_EXAMPLE_CONFIG: Final[str] = "No example config to copy from at {path}."
NO_CONFIG_DIRECTORY: Final[str] = "No directory {directory} to put a config file in; create it first."
INVALID_TOML: Final[str] = "{path} is not valid TOML: {error}"
UNKNOWN_TABLES: Final[str] = (
    "{path} has settings SampleRipper does not use: {unknown}. Settings belong under {readable}."
)
TABLE_WRITTEN_AS_VALUE: Final[str] = "{path} sets {name} to a single value; write it as a [{name}] table."
PLACEHOLDER_PATHS: Final[str] = (
    "{path} still has the example's stand-in path for {settings}. "
    "Open it and set your own module and library folders."
)
PLACEHOLDER_PASSWORDS: Final[str] = (
    "{path} still has the example's stand-in password for {settings}. Replace it with a password of your own."
)
INVALID_SETTINGS: Final[str] = "Invalid settings in {path}: {problems}{hint}"
DATABASE_URL_HINT: Final[str] = " A command run without --config also reads the database from {variable}."
WEAK_READER_PASSWORD: Final[str] = "The reader password is shorter than {length} characters. Use a generated one."
