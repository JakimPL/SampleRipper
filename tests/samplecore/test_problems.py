from __future__ import annotations

import pytest

from samplecore.problems import MessageCode, Problem, ProblemError, ProblemValueError


def test_a_problem_names_its_code_values_and_reason() -> None:
    problem = Problem.of(MessageCode.FOLDER_UNREADABLE, reason="Permission denied", folder="/music")

    assert problem.model_dump(mode="json") == {
        "code": "folder_unreadable",
        "params": {"folder": "/music"},
        "reason": "Permission denied",
    }


@pytest.mark.parametrize("error_type", [ProblemError, ProblemValueError])
def test_an_error_carrying_a_problem_says_its_reason_or_else_its_code(error_type: type[ProblemError]) -> None:
    with_reason = error_type(Problem.of(MessageCode.BUILD_REFUSED, reason="no space left"))
    without_reason = error_type(Problem.of(MessageCode.BUILD_IN_PROGRESS, reason=None))

    assert str(with_reason) == "no space left"
    assert str(without_reason) == MessageCode.BUILD_IN_PROGRESS.value
