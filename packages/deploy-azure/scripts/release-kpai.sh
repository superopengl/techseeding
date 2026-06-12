#!/usr/bin/env bash
set -euo pipefail

# Release kpai on Azure: build + push image to ACR, then update the Container
# App to that image tag, then run the migration job.
#
# Optional env (same as deploy-apps.sh; auto-discovered if AZURE_DEPLOYMENT_NAME set):
#   TAG                        default: short git SHA
#   AZURE_ACR_LOGIN_SERVER
#   AZURE_RG                   default: techseeding-rg

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
export TAG

echo "==> Phase 1: build + push"
APP=kpai TAG="$TAG" "$DEPLOY_DIR/scripts/build-and-push.sh"

echo "==> Phase 2: update Container App image"
az containerapp update \
  --name kpai \
  --resource-group "$AZURE_RG" \
  --image "${AZURE_ACR_LOGIN_SERVER}/kpai:${TAG}" \
  --output none

echo "==> Phase 3: run migrations"
APP=kpai "$DEPLOY_DIR/scripts/migrate.sh"

echo ""
echo "==> kpai released at tag $TAG"
echo "    Tail logs:  az containerapp logs show --name kpai --resource-group $AZURE_RG --follow"
