#!/usr/bin/env bash
set -euo pipefail

# Release ytai on Azure: build + push, update Container App, run migrations.

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
export TAG

echo "==> Phase 1: build + push"
APP=ytai TAG="$TAG" "$DEPLOY_DIR/scripts/build-and-push.sh"

echo "==> Phase 2: update Container App image"
az containerapp update \
  --name ytai \
  --resource-group "$AZURE_RG" \
  --image "${AZURE_ACR_LOGIN_SERVER}/ytai:${TAG}" \
  --output none

echo "==> Phase 3: run migrations"
APP=ytai "$DEPLOY_DIR/scripts/migrate.sh"

echo ""
echo "==> ytai released at tag $TAG"
echo "    Tail logs:  az containerapp logs show --name ytai --resource-group $AZURE_RG --follow"
