from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Final

from samplecore.cli_parsing import add_subcommand
from samplecore.cli_support import port_number
from samplecore.config import LibraryConfig
from samplecore.exit_status import ExitStatus
from samplemorph.paths import DEFAULT_FILTER_SELECTION_PATH, DEFAULT_SELECTION_PATH
from samplemorph.routes.selection import read_filter_selection, read_route_selection
from samplemorph.service.messages import RENDERER_COMPILED, SERVING_NOTHING, WARMING_NOTHING
from samplemorph.service.settings import ServiceSettings

COMMAND_NAME: Final[str] = "serve"
WARM_COMMAND_NAME: Final[str] = "warm"

_logger = logging.getLogger(__name__)


def add_parser(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = add_subcommand(commands, COMMAND_NAME, summary="Serve morphs between two samples over HTTP.")
    parser.add_argument("--host", type=str, default=None, help="The address to bind, in place of the configured one.")
    parser.add_argument(
        "--port", type=port_number, default=None, help="The port to bind, in place of the configured one."
    )
    _add_selection_arguments(parser)


def add_warm_parser(commands: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    parser = add_subcommand(
        commands,
        WARM_COMMAND_NAME,
        summary="Compile the renderer and save its code, so `morph serve` starts in seconds afterward.",
    )
    _add_selection_arguments(parser)


def _add_selection_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--selection",
        type=Path,
        default=DEFAULT_SELECTION_PATH,
        help="The YAML file naming the settings every morph renders under.",
    )
    parser.add_argument(
        "--filter-selection",
        type=Path,
        default=DEFAULT_FILTER_SELECTION_PATH,
        help="The YAML file naming the settings the filter this process hands over is read under.",
    )


def run(config: LibraryConfig, arguments: argparse.Namespace) -> None:
    """Build the routes the two selection files name, then serve morphs over HTTP at the address the configuration names.

    One process renders the morph its selection names and hands over the filter its filter selection
    names, so the renderer plays a gliding morph while a plugin reads the filter beside it.

    Raises:
        SystemExit: either selection file cannot be read, or the filter selection glides, reported in
            one line before any address is bound.
    """
    # The server is imported here, so parsing arguments stays clear of it.
    # pylint: disable=import-outside-toplevel
    import uvicorn

    from samplemorph.service.app import create_app
    from samplemorph.service.renderer import load_renderer

    host, port = _bind_address(config, arguments)
    try:
        renderer = load_renderer(_service_settings(config, arguments))
    except ValueError as error:
        _logger.error("%s", SERVING_NOTHING.format(reason=error))
        sys.exit(ExitStatus.REFUSED)

    uvicorn.run(create_app(renderer, host=host), host=host, port=port)


def warm(config: LibraryConfig, arguments: argparse.Namespace) -> None:
    """Build and warm the routes the two selection files name, binding no address, so their compiled code is saved.

    numba keeps the code in the folder `NUMBA_CACHE_DIR` names, so an image that warms its renderer
    as it is built starts every renderer from it in seconds.

    Raises:
        SystemExit: either selection file cannot be read, or the filter selection glides.
    """
    # pylint: disable-next=import-outside-toplevel
    from samplemorph.service.renderer import load_renderer

    try:
        load_renderer(_service_settings(config, arguments))
    except ValueError as error:
        _logger.error("%s", WARMING_NOTHING.format(reason=error))
        sys.exit(ExitStatus.REFUSED)
    _logger.info("%s", RENDERER_COMPILED)


def _service_settings(config: LibraryConfig, arguments: argparse.Namespace) -> ServiceSettings:
    """What the process serves, as the configuration and the two selection files name it.

    Raises:
        ValueError: either selection file cannot be read, or the filter selection glides.
    """
    return ServiceSettings(
        library_root=config.library_root,
        sample_directories=config.sample_directories,
        selection=read_route_selection(arguments.selection),
        filter_selection=read_filter_selection(arguments.filter_selection),
    )


def _bind_address(config: LibraryConfig, arguments: argparse.Namespace) -> tuple[str, int]:
    """The host and port to bind: the flags first, then the `[inference] url` the API dials."""
    host = arguments.host if arguments.host is not None else config.inference.host
    port = arguments.port if arguments.port is not None else config.inference.port
    return host, port
