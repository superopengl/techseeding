#!/bin/sh
set -e

# In ECS we inject DB connection bits as separate secrets (PG_*) since
# Secrets Manager fields can't be composed into a single env var. Compose
# KPAI_DATABASE_URL here when those parts are present.
if [ -z "$KPAI_DATABASE_URL" ] && [ -n "$PG_HOST" ]; then
  export KPAI_DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}"
fi

# Run database migrations on startup when RUN_MIGRATIONS=true
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npx drizzle-kit migrate --config src/api/drizzle.config.js
fi

exec "$@"
