from __future__ import annotations

from enum import StrEnum, unique
from typing import Self

from pydantic import BaseModel

from samplecore.models.base import FROZEN

ParameterValue = str | int


@unique
class MessageCode(StrEnum):
    """What went wrong, named for the web app to word in the person's language."""

    NOT_ADMITTED = "not_admitted"
    NOT_FOUND = "not_found"
    UNREADABLE_AUDIO = "unreadable_audio"
    MORPH_UNAVAILABLE = "morph_unavailable"
    MORPH_TIMED_OUT = "morph_timed_out"
    MORPH_REFUSED = "morph_refused"
    CURATION_WITHHELD = "curation_withheld"
    TOO_MANY_REQUESTS = "too_many_requests"
    TOO_MANY_MORPHS = "too_many_morphs"
    MORPHS_BUSY = "morphs_busy"
    LIBRARY_NOT_OPEN = "library_not_open"
    LIBRARY_IN_USE = "library_in_use"
    LIBRARY_OPEN_FAILED = "library_open_failed"
    PUBLIC_LIBRARY_REFUSED = "public_library_refused"
    SAVE_FOLDERS_FIRST = "save_folders_first"
    BUILD_IN_PROGRESS = "build_in_progress"
    BUILD_ALREADY_RUNNING = "build_already_running"
    BUILD_STEP_STOPPED = "build_step_stopped"
    BUILD_REFUSED = "build_refused"
    FOLDER_NOT_A_FOLDER = "folder_not_a_folder"
    FOLDER_UNREADABLE = "folder_unreadable"
    FOLDER_NOT_ABSOLUTE = "folder_not_absolute"
    FOLDERS_OVERLAP = "folders_overlap"
    EXCLUSION_EMPTY = "exclusion_empty"
    SETTINGS_INVALID = "settings_invalid"
    CONFIGURATION_REFUSED = "configuration_refused"


class Problem(BaseModel):
    """One thing that went wrong, as the web app words it: a code, the values its sentence names, and the technical reason.

    The ``reason`` holds the plain technical sentence for a reader who can use it; the web app shows
    it beside its own wording of the code.
    """

    model_config = FROZEN

    code: MessageCode
    params: dict[str, ParameterValue]
    reason: str | None

    @classmethod
    def of(cls, code: MessageCode, *, reason: str | None, **params: ParameterValue) -> Self:
        return cls(code=code, params=params, reason=reason)


class ProblemError(Exception):
    """Raised for a refusal the web app words from its ``problem``."""

    def __init__(self, problem: Problem) -> None:
        super().__init__(problem.reason or problem.code.value)
        self.problem = problem


class ProblemValueError(ValueError):
    """Raised by a settings validator whose refusal the web app words from its ``problem``."""

    def __init__(self, problem: Problem) -> None:
        super().__init__(problem.reason or problem.code.value)
        self.problem = problem
