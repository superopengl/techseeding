#!/usr/bin/env bash
set -euo pipefail

# Release txd to Azure Static Web Apps. Uses the `swa` CLI (Azure Static Web
# Apps CLI) — install once with `npm i -g @azure/static-web-apps-cli`.
#
# Required env:
#   AZURE_SWA_NAME            e.g. techseeding-txd
#   AZURE_RG                  default: techseeding-rg
# Optional env:
#   AZURE_SWA_DEPLOYMENT_TOKEN — if not set, the script fetches it via `az`.

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

: "${AZURE_SWA_NAME:?AZURE_SWA_NAME must be set (e.g. techseeding-txd)}"

if ! command -v swa >/dev/null 2>&1; then
  echo "ERROR: 'swa' CLI not found. Install with:" >&2
  echo "  npm install -g @azure/static-web-apps-cli" >&2
  exit 1
fi

if [ -z "${AZURE_SWA_DEPLOYMENT_TOKEN:-}" ]; then
  echo "==> Fetching deployment token for $AZURE_SWA_NAME"
  AZURE_SWA_DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$AZURE_SWA_NAME" \
    --resource-group "$AZURE_RG" \
    --query "properties.apiKey" \
    --output tsv)
fi

echo "==> Building txd-web"
( cd "$REPO_ROOT" && pnpm -F @techseeding/txd build:prod )

echo "==> Deploying to Static Web App $AZURE_SWA_NAME"
( cd "$REPO_ROOT/apps/txd" && \
  swa deploy ./build \
    --deployment-token "$AZURE_SWA_DEPLOYMENT_TOKEN" \
    --env production )

echo ""
echo "==> txd released to https://$(az staticwebapp show --name "$AZURE_SWA_NAME" --resource-group "$AZURE_RG" --query defaultHostname -o tsv)"
