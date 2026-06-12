#!/usr/bin/env bash
set -euo pipefail

# Populate Key Vault secret slots from a local .env.azure-secrets file.
# Bicep creates the slots empty; this script fills the values. Idempotent.
#
# .env.azure-secrets format (one KEY=VALUE per line, KEY matches the Bicep
# secret name with `-` instead of `_`):
#
#   KPAI_DB_PASSWORD=...
#   KPAI_JWT_SECRET=...
#   KPAI_SANDBOX_DEEPSEEK_API_KEY=...
#   KPAI_ADMIN_PASSWORD=...
#   KPAI_ACS_CONNECTION_STRING=...
#   YTAI_DB_PASSWORD=...
#   YTAI_JWT_SECRET=...
#   YTAI_OPENROUTER_API_KEY=...
#   YTAI_ADMIN_PASSWORD=...
#   YTAI_ACS_CONNECTION_STRING=...
#   KPAI_GOOGLE_CLIENT_ID=...      # public client ID — KV stores for ops parity
#   YTAI_GOOGLE_CLIENT_ID=...      # same
#   PG_ADMIN_PASSWORD=...
#
# Required env:
#   AZURE_KV_NAME  — e.g. techseeding-kv. Get it from deploy-all.sh output.

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

KV_NAME="${AZURE_KV_NAME:?AZURE_KV_NAME must be set (e.g. techseeding-kv)}"
ENV_FILE="${1:-${DEPLOY_DIR}/.env.azure-secrets}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: secrets file not found: $ENV_FILE" >&2
  echo "  Create it with the keys listed at the top of this script." >&2
  exit 1
fi

# Map of ENV_VAR_KEY → kv-secret-name
declare -A MAP=(
  [KPAI_DB_PASSWORD]=kpai-db-password
  [KPAI_JWT_SECRET]=kpai-jwt-secret
  [KPAI_SANDBOX_DEEPSEEK_API_KEY]=kpai-sandbox-deepseek-api-key
  [KPAI_ADMIN_PASSWORD]=kpai-admin-password
  [KPAI_ACS_CONNECTION_STRING]=kpai-acs-connection-string
  [KPAI_GOOGLE_CLIENT_ID]=kpai-google-client-id
  [YTAI_DB_PASSWORD]=ytai-db-password
  [YTAI_JWT_SECRET]=ytai-jwt-secret
  [YTAI_OPENROUTER_API_KEY]=ytai-openrouter-api-key
  [YTAI_ADMIN_PASSWORD]=ytai-admin-password
  [YTAI_ACS_CONNECTION_STRING]=ytai-acs-connection-string
  [YTAI_GOOGLE_CLIENT_ID]=ytai-google-client-id
  [PG_ADMIN_PASSWORD]=pg-admin-password
)

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

for env_key in "${!MAP[@]}"; do
  kv_secret="${MAP[$env_key]}"
  value="${!env_key:-}"
  if [ -z "$value" ]; then
    echo "==> Skipping $kv_secret (env $env_key not set in $ENV_FILE)"
    continue
  fi
  echo "==> Seeding $kv_secret"
  az keyvault secret set \
    --vault-name "$KV_NAME" \
    --name "$kv_secret" \
    --value "$value" \
    --output none
done

echo ""
echo "==> Done. Move or delete $ENV_FILE — keep it out of the repo working tree."
