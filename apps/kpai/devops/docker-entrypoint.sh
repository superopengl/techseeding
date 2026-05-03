#!/bin/sh
set -e

# Run database migrations on startup when RUN_MIGRATIONS=true
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npx drizzle-kit migrate --config src/api/drizzle.config.js
fi

exec "$@"
