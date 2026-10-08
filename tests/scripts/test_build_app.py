from __future__ import annotations

import importlib.util
import subprocess
import sys
import types
from dataclasses import dataclass
from pathlib import Path

import pytest

from tests.paths import BUILD_APP_SCRIPT, SCRIPTS_DIRECTORY


def _load_build_app() -> types.ModuleType:
    """Imports the script by file path, with the scripts folder on the path for its sibling modules."""
    sys.path.insert(0, str(SCRIPTS_DIRECTORY))
    try:
        spec = importlib.util.spec_from_file_location("build_app", BUILD_APP_SCRIPT)
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
    finally:
        sys.path.remove(str(SCRIPTS_DIRECTORY))
    return module


build_app = _load_build_app()


@dataclass(frozen=True)
class Launchers:
    """The launcher in `bin/` a build replaces, the one it built, and what the build did to the first."""

    replaced: Path
    replacement: Path
    replaced_python: Path
    replacement_python: Path
    pythons: dict[Path, Path]
    events: list[str]


@dataclass(frozen=True)
class RetirementCase:
    replaced_built: bool
    same_contents: bool
    replaced_started: bool
    expected: list[str]


@pytest.fixture
def launchers(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Launchers:
    """Two launchers whose PyApp commands answer from a table and record what the build asked of them."""
    events: list[str] = []
    launchers = Launchers(
        replaced=tmp_path / "bin" / "SampleRipper",
        replacement=tmp_path / "build" / "pyapp",
        replaced_python=tmp_path / "installed" / "replaced" / "bin" / "python",
        replacement_python=tmp_path / "installed" / "replacement" / "bin" / "python",
        pythons={},
        events=events,
    )

    def quit_application(command: list[Path | str], *, check: bool) -> subprocess.CompletedProcess[str]:
        assert check
        assert command[0] == launchers.replaced_python
        events.append("quit")
        return subprocess.CompletedProcess(command, 0)

    def remove_installation(executable: Path) -> None:
        assert executable == launchers.replaced
        events.append("remove")

    monkeypatch.setattr(build_app, "installed_python", launchers.pythons.__getitem__)
    monkeypatch.setattr(build_app, "remove_installation", remove_installation)
    monkeypatch.setattr(build_app.subprocess, "run", quit_application)
    return launchers


@pytest.mark.parametrize(
    "case",
    [
        RetirementCase(replaced_built=False, same_contents=False, replaced_started=False, expected=[]),
        RetirementCase(replaced_built=True, same_contents=True, replaced_started=True, expected=[]),
        RetirementCase(replaced_built=True, same_contents=False, replaced_started=False, expected=["remove"]),
        RetirementCase(replaced_built=True, same_contents=False, replaced_started=True, expected=["quit", "remove"]),
    ],
    ids=["first build", "same contents", "new contents, never started", "new contents, started"],
)
def test_a_replaced_launcher_of_other_contents_retires_its_installation(
    launchers: Launchers, case: RetirementCase
) -> None:
    launchers.pythons[launchers.replaced] = launchers.replaced_python
    launchers.pythons[launchers.replacement] = (
        launchers.replaced_python if case.same_contents else launchers.replacement_python
    )
    if case.replaced_built:
        launchers.replaced.parent.mkdir(parents=True)
        launchers.replaced.touch()
    if case.replaced_started:
        launchers.replaced_python.parent.mkdir(parents=True)
        launchers.replaced_python.touch()

    build_app._retire_replaced_installation(  # pylint: disable=protected-access
        launchers.replaced, replacement=launchers.replacement
    )

    assert launchers.events == case.expected
