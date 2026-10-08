from __future__ import annotations

from typing import Final

# What a pipeline command tells the person whose `[pipeline]` settings it cannot use, each a sentence of its own.

STEP_SETTING_REFUSED: Final[str] = "[{table}.{step}] {location}: {problem}"
CONFIG_UNREADABLE: Final[str] = "{path} cannot be read ({reason})"
TABLE_NOT_A_TABLE: Final[str] = "[{table}] in {path} holds a value where a table belongs"
SETTING_REFUSED: Final[str] = "[{table}] in {path}: {location}: {problem}"
CEILING_REFUSED: Final[str] = "[{table}] in {path}: {error}"
