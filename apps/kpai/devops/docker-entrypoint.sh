#!/bin/sh
set -e

# In ECS we inject DB connection bits as separate secrets (PG_*) since
# Secrets Manager fields can't be composed into a single env var. Compose
# KPAI_DATABASE_URL here when those parts are present.
if [ -z "$KPAI_DATABASE_URL" ] && [ -n "$PG_HOST" ]; then
  export KPAI_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
fi

# Run database migrations on startup when RUN_MIGRATIONS=true.
# Uses drizzle-orm's runtime migrator (no drizzle-kit dependency) for a fast
# cold start.
#
# Retry on failure: on a fresh stack, the Aurora Serverless v2 cluster endpoint
# DNS can take 1-2 minutes to propagate after the writer reports "available",
# so the first few attempts may fail with ENOTFOUND. Bounded retry keeps the
# container from tripping the ECS deployment circuit breaker.
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations against ${PG_HOST:-(KPAI_DATABASE_URL provided)}..."
  attempt=1
  max_attempts=12
  while true; do
    if node src/api/migrate.js; then
      break
    fi
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Migration failed after $max_attempts attempts; giving up." >&2
      exit 1
    fi
    echo "Migration attempt $attempt failed; retrying in 15s..." >&2
    attempt=$((attempt + 1))
    sleep 15
  done
fi

exec "$@"
