from __future__ import annotations

from typing import Final

# What `sampleripper links import` tells the person importing, each a sentence of its own.

NO_SOURCE_DIRECTORY: Final[str] = (
    "module_source_directory isn't set. Set it to the folder that holds your modules; the "
    "locations in the file are relative to it."
)
SOURCE_DIRECTORY_MISSING: Final[str] = "{problem}. Set module_source_directory to the folder that holds your modules."
IMPORTED_NOTHING: Final[str] = "Nothing was imported: {problem}."
NO_HEADER: Final[str] = "{path} has no header row. The first line must name the columns: location and link."
COLUMN_MISSING: Final[str] = "{path} has no {column} column. The header must name both location and link."
ROW_REFUSED: Final[str] = "line {line} of {path}: {problem}"
REPEATED_LOCATION: Final[str] = "{path} lists {location} more than once, on lines {lines}."
CONFLICTING_LINKS: Final[str] = "{first} and {second} are the same module ({module_hash}) but have different links."
FILE_MISSING: Final[str] = "Skipped {location}: the file is missing or can't be read."
NOT_CATALOGED: Final[str] = "Skipped {location}: no module in your library matches that file."
MORE_SKIPPED: Final[str] = "... and {count} more."
RECORDED: Final[str] = (
    "Saved {recorded} link(s) from {path}. {missing} file(s) were missing and {uncataloged} " "weren't in your library."
)
