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
