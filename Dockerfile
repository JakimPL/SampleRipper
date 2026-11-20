# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS frontend

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci
# The web app reads its version from the project file beside the frontend folder, as in a checkout.
COPY pyproject.toml /pyproject.toml
COPY frontend ./
# The web app names the commit it is built from: Railway's own, or the one `just docker-build` hands in.
ARG RAILWAY_GIT_COMMIT_SHA
ARG SAMPLERIPPER_BUILD_COMMIT=${RAILWAY_GIT_COMMIT_SHA}
RUN npm run build

FROM python:3.13-slim-bookworm AS builder

COPY --from=ghcr.io/astral-sh/uv:0.9.7 /uv /uvx /bin/
ENV UV_LINK_MODE=copy UV_COMPILE_BYTECODE=1 UV_PYTHON_DOWNLOADS=never

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --extra server --extra morph --no-dev --no-editable --frozen --no-install-project
COPY README.md hatch_build.py ./
COPY src ./src
RUN uv sync --extra server --extra morph --no-dev --no-editable --frozen
# An image keeps a file's time in whole seconds, and numba trusts its saved code only while the
# source's time matches the one it saw, so the sources start with whole seconds before they reach
# the stage that compiles against them.
RUN python -c "import pathlib, os; [os.utime(file, ns=(state.st_atime_ns, state.st_mtime_ns // 10**9 * 10**9)) for file in pathlib.Path('/app/.venv').rglob('*.py') for state in [file.stat()]]"

FROM python:3.13-slim-bookworm AS runtime

RUN useradd --create-home --uid 1000 sampleripper
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --from=frontend /build/frontend /app/frontend
COPY docker/site.toml /app/config.toml
# glibc otherwise opens an allocator arena per thread, up to eight per core the host has; two arenas
# keep what the server's worker threads free in few places, where it is handed back to the system.
ENV PATH="/app/.venv/bin:${PATH}" \
    SAMPLERIPPER_CONFIG=/app/config.toml \
    SAMPLERIPPER_FRONTEND_DIRECTORY=/app/frontend \
    WEB_CONCURRENCY=1 \
    NUMBA_CACHE_DIR=/app/numba-cache \
    NUMBA_CPU_NAME=generic \
    MALLOC_ARENA_MAX=2 \
    PYTHONUNBUFFERED=1
# The renderer's compiled code is saved here once, for a generic processor so any host loads it, and
# every renderer the site starts reads it in place of compiling. numba writes beside what it reads.
RUN sampleripper morph warm && chown -R sampleripper:sampleripper /app/numba-cache
USER sampleripper

# A healthy site is one whose catalog answers, on the port the platform names.
HEALTHCHECK CMD ["python", "-c", "import os, urllib.request; urllib.request.urlopen(f\"http://127.0.0.1:{os.environ['PORT']}/api/health\", timeout=5)"]
ENTRYPOINT ["sampleripper"]
CMD ["site", "--host", "0.0.0.0"]
