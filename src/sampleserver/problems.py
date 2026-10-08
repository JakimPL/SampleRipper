from __future__ import annotations

from collections.abc import Mapping
from http import HTTPStatus
from types import MappingProxyType
from typing import Final

from fastapi import HTTPException

from samplecore.problems import MessageCode, Problem

NO_HEADERS: Final[Mapping[str, str]] = MappingProxyType({})


def refusal(status_code: HTTPStatus, problem: Problem, *, headers: Mapping[str, str] = NO_HEADERS) -> HTTPException:
    """The HTTP refusal whose ``detail`` is ``problem``, which the web app words from its code."""
    return HTTPException(status_code=status_code, detail=problem.model_dump(mode="json"), headers=dict(headers))


def plain_problem(code: MessageCode) -> Problem:
    """A problem the web app words from its code alone."""
    return Problem.of(code, reason=None)
