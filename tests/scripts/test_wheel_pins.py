from __future__ import annotations

import importlib.util
import sys
import types
import zipfile
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Final

import pytest

from tests.paths import WHEEL_PINS_SCRIPT

NAME: Final[str] = "sampleripper"
VERSION: Final[str] = "0.1.1"
VARIANT: Final[str] = "cu128"
MODULE_FILE: Final[str] = f"{NAME}/__init__.py"
DIST_INFO: Final[str] = f"{NAME}-{VERSION}.dist-info"
METADATA: Final[str] = f"Metadata-Version: 2.4\nName: {NAME}\nVersion: {VERSION}\nRequires-Dist: numpy\n"
PINNED_REQUIREMENT: Final[str] = "numpy==2.0.0"


def _load_wheel_pins() -> types.ModuleType:
    """Imports the script by file path -- it lives outside every installed package, by design."""
    spec = importlib.util.spec_from_file_location("wheel_pins", WHEEL_PINS_SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


wheel_pins = _load_wheel_pins()


@dataclass(frozen=True)
class Contents:
    """What a built wheel holds, and the requirements its launcher pins."""

    module: bytes
    requirements: str


ORIGINAL: Final[Contents] = Contents(
    module=b"ANSWER = 42\n", requirements=f"--extra-index-url https://example.com/simple\n{PINNED_REQUIREMENT}\n"
)


def _pinned_wheel(folder: Path, contents: Contents, *, variant: str | None) -> Path:
    """Build a wheel of ``contents`` in ``folder``, and pin it."""
    folder.mkdir()
    wheel = folder / f"{NAME}-{VERSION}-py3-none-any.whl"
    with zipfile.ZipFile(wheel, "w") as archive:
        archive.writestr(MODULE_FILE, contents.module)
        archive.writestr(f"{DIST_INFO}/METADATA", METADATA)
        archive.writestr(f"{DIST_INFO}/RECORD", "")
    requirements = folder / "requirements.txt"
    requirements.write_text(contents.requirements, encoding="utf-8")
    pinned: Path = wheel_pins.write_pinned_wheel(wheel, requirements, folder / "pinned", variant=variant)
    return pinned


def _version(pinned: Path) -> str:
    return pinned.name.split("-")[1]


@pytest.mark.parametrize("variant", [VARIANT, None], ids=["variant", "plain"])
def test_the_local_label_holds_the_variant_ahead_of_the_digest(tmp_path: Path, variant: str | None) -> None:
    public, local = _version(_pinned_wheel(tmp_path / "build", ORIGINAL, variant=variant)).split("+")
    *leading, digest = local.split(".")
    assert public == VERSION
    assert leading == ([variant] if variant is not None else [])
    assert digest.isalnum()


def test_the_metadata_names_the_labeled_version_and_the_pins(tmp_path: Path) -> None:
    pinned = _pinned_wheel(tmp_path / "build", ORIGINAL, variant=VARIANT)
    version = _version(pinned)
    with zipfile.ZipFile(pinned) as archive:
        metadata = archive.read(f"{NAME}-{version}.dist-info/METADATA").decode("utf-8")
    assert f"Version: {version}\n" in metadata
    assert f"Requires-Dist: {PINNED_REQUIREMENT}; extra == '{wheel_pins.APP_EXTRA}'" in metadata


def test_a_rebuild_of_the_same_contents_keeps_its_version(tmp_path: Path) -> None:
    first = _pinned_wheel(tmp_path / "first", ORIGINAL, variant=VARIANT)
    second = _pinned_wheel(tmp_path / "second", ORIGINAL, variant=VARIANT)
    assert _version(first) == _version(second)


@pytest.mark.parametrize(
    "changed",
    [
        replace(ORIGINAL, module=b"ANSWER = 43\n"),
        replace(ORIGINAL, requirements=ORIGINAL.requirements.replace(PINNED_REQUIREMENT, "numpy==2.0.1")),
    ],
    ids=["code", "pins"],
)
def test_new_contents_take_a_version_of_their_own(tmp_path: Path, changed: Contents) -> None:
    original = _pinned_wheel(tmp_path / "original", ORIGINAL, variant=VARIANT)
    rebuilt = _pinned_wheel(tmp_path / "rebuilt", changed, variant=VARIANT)
    assert _version(original) != _version(rebuilt)
