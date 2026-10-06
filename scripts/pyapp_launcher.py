from __future__ import annotations

import subprocess
from pathlib import Path


def installed_python(executable: Path) -> Path:
    """The interpreter a PyApp launcher installs the application with, which its `self python-path` names.

    The launcher names it before its first start has installed anything. The interpreter runs the
    application's own commands to their end on every system, while the launcher started as a GUI
    program on Windows returns at once.
    """
    named = subprocess.run([executable, "self", "python-path"], check=True, capture_output=True, text=True)
    return Path(named.stdout.strip())


def remove_installation(executable: Path) -> None:
    """Delete the packages a PyApp launcher installed, which its next start installs afresh."""
    subprocess.run([executable, "self", "remove"], check=True)
