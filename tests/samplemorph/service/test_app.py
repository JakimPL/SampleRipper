from __future__ import annotations

import time
from typing import Final

import pytest
from fastapi.testclient import TestClient

from samplemorph.service import app as app_module
from samplemorph.service.app import create_app
from samplemorph.service.settings import ServiceSettings
from tests.samplemorph.service.conftest import RENDERER_HOST, RENDERER_URL, load_renderer

TEST_INTERVAL_SECONDS: Final[float] = 0.01
WAIT_SECONDS: Final[float] = 10.0


def test_the_app_serves_the_renderer_it_was_built_around(settings: ServiceSettings) -> None:
    renderer = load_renderer(settings)

    with TestClient(create_app(renderer, host=RENDERER_HOST), base_url=RENDERER_URL) as client:
        assert client.app.state.renderer is renderer
        assert client.get("/morph/status").json()["fingerprint"] == renderer.fingerprint


def test_the_app_asks_its_renderer_to_empty_its_caches_when_quiet_until_it_stops(
    settings: ServiceSettings, monkeypatch: pytest.MonkeyPatch
) -> None:
    renderer = load_renderer(settings)
    checks: list[float] = []
    monkeypatch.setattr(app_module, "IDLE_CHECK_SECONDS", TEST_INTERVAL_SECONDS)
    monkeypatch.setattr(renderer, "release_when_idle", lambda *, now: checks.append(now) is not None)

    with TestClient(create_app(renderer, host=RENDERER_HOST), base_url=RENDERER_URL):
        deadline = time.monotonic() + WAIT_SECONDS
        while len(checks) < 2 and time.monotonic() < deadline:
            time.sleep(TEST_INTERVAL_SECONDS)
    checked_while_serving = len(checks)
    time.sleep(TEST_INTERVAL_SECONDS * 5)

    assert checked_while_serving >= 2
    assert len(checks) == checked_while_serving
