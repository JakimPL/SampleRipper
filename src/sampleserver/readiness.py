from __future__ import annotations

import asyncio
from collections.abc import Callable
from functools import partial

import anyio
from sqlalchemy import Connection

from sampleserver.connections import CatalogConnections
from sampleserver.response_cache import RevisionedJsonCache
from sampleserver.routers.cloud import prepare_cloud_categories, prepare_cloud_points
from sampleserver.spectral_cache import SpectralVectorCache


async def prepare_whole_catalog_answers(
    connections: CatalogConnections,
    *,
    spectral_vectors: SpectralVectorCache,
    cloud: RevisionedJsonCache,
    categories: RevisionedJsonCache,
    category_tags: RevisionedJsonCache,
) -> None:
    """Read the spectral vectors and build the cloud's answers, so the app holds them before it answers anyone.

    Each takes seconds over a whole catalog, which a visitor would otherwise wait out on the first
    cloud or the first search for similar samples. The vectors, the points and the categories are
    prepared side by side, each on a connection of its own and a worker thread, so preparing takes
    about as long as the longest of them. A catalog that cannot be read fails the start with the
    error it gave, once every piece has settled, so a server answering anyone answers with its
    whole catalog.
    """
    outcomes = await asyncio.gather(
        spectral_vectors.load(connections),
        _prepared(connections, partial(prepare_cloud_points, cloud=cloud)),
        _prepared(connections, partial(prepare_cloud_categories, categories=categories, category_tags=category_tags)),
        return_exceptions=True,
    )
    for outcome in outcomes:
        if isinstance(outcome, Exception):
            raise outcome


async def _prepared(connections: CatalogConnections, prepare: Callable[[Connection], None]) -> None:
    """Run ``prepare`` on a worker thread over a read-only connection of its own."""
    async with connections.read_only() as connection:
        await anyio.to_thread.run_sync(prepare, connection)
