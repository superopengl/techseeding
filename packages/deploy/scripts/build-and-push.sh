#!/usr/bin/env bash
set -euo pipefail

# Build an app's Docker image and push it to Azure Container Registry.
#
# Required env: APP (kpai|ytai)
# Optional env:
#   ACR_LOGIN_SERVER  default: techseedingacr.azurecr.io
#   TAG               default: short git SHA, falls back to timestamp
#   APP_DIR           default: <repo>/apps/$APP
#   DOCKERFILE        default: devops/Dockerfile (relative to APP_DIR)
#   BUILD_CMD         default: pnpm --filter ./apps/$APP build:prod
#
# Usage: APP=kpai ./scripts/build-and-push.sh

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

APP="${APP:?APP must be set (kpai|ytai)}"
ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:-techseedingacr.azurecr.io}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
APP_DIR="${APP_DIR:-$REPO_ROOT/apps/$APP}"
DOCKERFILE="${DOCKERFILE:-devops/Dockerfile}"
BUILD_CMD="${BUILD_CMD:-pnpm --filter ./apps/$APP build:prod}"

ACR_NAME="${ACR_LOGIN_SERVER%%.*}"

echo "==> Logging in to ACR ($ACR_LOGIN_SERVER)"
az acr login --name "$ACR_NAME"

# Vite bakes the Google client ID into the JS bundle at build time. The
# Container App's runtime env var (set by deploy-apps.sh) only covers the
# API side; the static bundle needs its own injection. Fetch from Key Vault
# so the source of truth stays in one place — otherwise a release built
# without the var in the operator's shell ships a "configure ..." placeholder
# to prod.
case "$APP" in
  kpai)
    if [ -z "${KPAI_GOOGLE_CLIENT_ID:-}" ]; then
      KPAI_GOOGLE_CLIENT_ID="$(kv_secret kpai-google-client-id)"
    fi
    if [ -z "$KPAI_GOOGLE_CLIENT_ID" ]; then
      echo "ERROR: KPAI_GOOGLE_CLIENT_ID is empty (KV '$AZURE_KV_NAME' secret 'kpai-google-client-id' missing?)" >&2
      exit 1
    fi
    export KPAI_GOOGLE_CLIENT_ID
    ;;
  ytai)
    if [ -z "${YTAI_GOOGLE_CLIENT_ID:-}" ]; then
      YTAI_GOOGLE_CLIENT_ID="$(kv_secret ytai-google-client-id)"
    fi
    if [ -z "$YTAI_GOOGLE_CLIENT_ID" ]; then
      echo "ERROR: YTAI_GOOGLE_CLIENT_ID is empty (KV '$AZURE_KV_NAME' secret 'ytai-google-client-id' missing?)" >&2
      exit 1
    fi
    export YTAI_GOOGLE_CLIENT_ID
    ;;
esac

echo "==> Building production bundle ($APP)"
( cd "$REPO_ROOT" && eval "$BUILD_CMD" )

if [ "$APP" = "ytai" ]; then
  echo "==> Building ytai image (this takes a while — ~3 GB image)"
else
  echo "==> Building $APP image (tag: $TAG)"
fi

( cd "$APP_DIR" && \
  docker buildx build \
    --platform linux/amd64 \
    -f "$DOCKERFILE" \
    -t "${ACR_LOGIN_SERVER}/${APP}:${TAG}" \
    -t "${ACR_LOGIN_SERVER}/${APP}:latest" \
    --push . )

echo "==> Pushed ${ACR_LOGIN_SERVER}/${APP}:${TAG}"
