#!/bin/bash
# Boot the two processes that make up the ytai container. The app runs in
# the foreground as PID 1 so ECS / ACA task stop SIGTERM cleanly exits the
# container; TTS is backgrounded.
#
# Restart semantics: if Kokoro crashes, the app keeps serving and the UI
# greys out voice when TTS returns errors. If the app crashes, the
# container exits and the runtime schedules a fresh task.

set -eu

# Build YTAI_DATABASE_URL from the individual env vars/secrets injected by
# ECS (so we can pull user/password from the shared Aurora secret while
# hard-coding host/port/database). The app and drizzle.config both read
# YTAI_DATABASE_URL directly.
if [ -n "${YTAI_PG_HOST:-}" ] && [ -z "${YTAI_DATABASE_URL:-}" ]; then
  # sslmode=require: Aurora's pg_hba.conf rejects unencrypted connections
  # from inside the VPC. `require` negotiates TLS but doesn't verify the
  # server cert (acceptable inside the VPC where MITM isn't a threat).
  export YTAI_DATABASE_URL="postgres://${YTAI_PG_USER}:${YTAI_PG_PASSWORD}@${YTAI_PG_HOST}:${YTAI_PG_PORT:-5432}/${YTAI_PG_DATABASE:-ytai}?sslmode=require"
fi

# Run drizzle migrations on every task start. Idempotent — drizzle tracks
# applied migrations in __drizzle_migrations. Skip with RUN_MIGRATIONS=false
# (e.g., if you're rolling back and don't want the latest schema applied).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "==> Running ytai migrations"
  # migrationsFolder in migrate.js is relative to cwd. dist/ contents land
  # directly under /opt/ytai/ (kpai-style image layout), so the drizzle
  # migration files are at /opt/ytai/src/api/drizzle.
  cd /opt/ytai && node src/api/db/migrate.js
fi

# Forward SIGTERM to the TTS child so task stop drains it rather than
# waiting for the grace-period SIGKILL.
shutdown() {
  kill -TERM "${TTS_PID:-0}" 2>/dev/null || true
  exit 0
}
trap shutdown TERM INT

# TTS — Kokoro FastAPI. Replicates the base image's entrypoint but binds
# to localhost (only the ytai app talks to it).
(
  cd /app
  exec uv run --extra cpu --no-sync python -m uvicorn api.src.main:app \
    --host 127.0.0.1 --port 8880 --log-level warning
) &
TTS_PID=$!

# ytai app — foreground, becomes PID 1's child but receives SIGTERM via the
# trap above when the task is stopped. Same cwd as migrations so any future
# relative-path lookups (e.g., drizzle, static-asset paths) match build time.
cd /opt/ytai
exec node src/api/server.js
