#!/usr/bin/env bash
set -euo pipefail

# Deploy / update the Container Apps + migration Jobs (apps.bicep).
# Run AFTER images are in ACR. Idempotent — re-run to push a new image tag.
#
# Required env (auto-discovered from main.bicep if AZURE_DEPLOYMENT_NAME is set):
#   AZURE_RG                  default: techseeding-rg
#   AZURE_ACR_LOGIN_SERVER    e.g. techseedingacr.azurecr.io
#   AZURE_ACR_ID              full resource ID
#   AZURE_KV_ID               full resource ID
#   AZURE_KV_URI              https://.../vault.azure.net/
#   AZURE_STORAGE_ID          full resource ID
#   AZURE_STORAGE_BLOB_ENDPOINT  https://.../blob.core.windows.net/
#   AZURE_PG_FQDN
#   AZURE_PG_ADMIN_USERNAME   default: pgadmin
#   AZURE_ACA_ENV_ID
#   AZURE_ACS_SENDER          e.g. donotreply@techseeding.com.au
# Optional env:
#   KPAI_IMAGE_TAG            default: latest
#   YTAI_IMAGE_TAG            default: latest
#   KPAI_CUSTOM_DOMAIN        default: empty (no custom domain yet)
#   YTAI_CUSTOM_DOMAIN        default: empty
#   KPAI_GOOGLE_CLIENT_ID, YTAI_GOOGLE_CLIENT_ID
#   YTAI_OPENROUTER_CHAT_MODEL, YTAI_OPENROUTER_BASE_URL

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

ENV_FILE="${DEPLOY_DIR}/.env.azure-deploy"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

# Auto-fill from main deployment outputs if env vars not provided.
if [ -n "${AZURE_DEPLOYMENT_NAME:-}" ]; then
  : "${AZURE_ACR_LOGIN_SERVER:=$(az_output "$AZURE_DEPLOYMENT_NAME" acrLoginServer sub)}"
  : "${AZURE_PG_FQDN:=$(az_output "$AZURE_DEPLOYMENT_NAME" postgresFqdn sub)}"
  : "${AZURE_KV_URI:=$(az_output "$AZURE_DEPLOYMENT_NAME" keyVaultUri sub)}"
  : "${AZURE_ACA_ENV_ID:=$(az_output "$AZURE_DEPLOYMENT_NAME" containerAppsEnvId sub)}"
  : "${AZURE_STORAGE_BLOB_ENDPOINT:=$(az_output "$AZURE_DEPLOYMENT_NAME" storageBlobEndpoint sub)}"
  : "${AZURE_ACS_SENDER:=donotreply@$(az_output "$AZURE_DEPLOYMENT_NAME" acsManagedDomainSender sub)}"
fi

: "${AZURE_RG:=techseeding-rg}"
: "${AZURE_PG_ADMIN_USERNAME:=pgadmin}"
: "${KPAI_IMAGE_TAG:=latest}"
: "${YTAI_IMAGE_TAG:=latest}"
: "${KPAI_CUSTOM_DOMAIN:=}"
: "${YTAI_CUSTOM_DOMAIN:=}"
: "${KPAI_GOOGLE_CLIENT_ID:=}"
: "${YTAI_GOOGLE_CLIENT_ID:=}"
: "${YTAI_OPENROUTER_CHAT_MODEL:=google/gemini-2.5-pro}"
: "${YTAI_OPENROUTER_BASE_URL:=https://openrouter.ai/api/v1}"

# Resolve resource IDs from names (when bicep main has run we know names).
acr_name="${AZURE_ACR_LOGIN_SERVER%%.*}"
AZURE_ACR_ID="${AZURE_ACR_ID:-$(az acr show --name "$acr_name" --query id -o tsv)}"
kv_name="$(echo "$AZURE_KV_URI" | sed -E 's|https://([^.]+)\..*|\1|')"
AZURE_KV_ID="${AZURE_KV_ID:-$(az keyvault show --name "$kv_name" --query id -o tsv)}"
storage_name="$(echo "$AZURE_STORAGE_BLOB_ENDPOINT" | sed -E 's|https://([^.]+)\..*|\1|')"
AZURE_STORAGE_ID="${AZURE_STORAGE_ID:-$(az storage account show --name "$storage_name" --query id -o tsv)}"

DEPLOYMENT_NAME="${AZURE_APPS_DEPLOYMENT_NAME:-techseeding-apps-$(date +%Y%m%d-%H%M%S)}"

echo "==> Deploying apps.bicep into $AZURE_RG"
echo "    kpai image: $AZURE_ACR_LOGIN_SERVER/kpai:$KPAI_IMAGE_TAG"
echo "    ytai image: $AZURE_ACR_LOGIN_SERVER/ytai:$YTAI_IMAGE_TAG"

cd "$DEPLOY_DIR"

az deployment group create \
  --resource-group "$AZURE_RG" \
  --name "$DEPLOYMENT_NAME" \
  --template-file apps.bicep \
  --parameters \
    containerAppsEnvId="$AZURE_ACA_ENV_ID" \
    acrLoginServer="$AZURE_ACR_LOGIN_SERVER" \
    acrId="$AZURE_ACR_ID" \
    keyVaultId="$AZURE_KV_ID" \
    keyVaultUri="$AZURE_KV_URI" \
    storageAccountId="$AZURE_STORAGE_ID" \
    storageBlobEndpoint="$AZURE_STORAGE_BLOB_ENDPOINT" \
    postgresFqdn="$AZURE_PG_FQDN" \
    acsSender="$AZURE_ACS_SENDER" \
    kpaiImageTag="$KPAI_IMAGE_TAG" \
    ytaiImageTag="$YTAI_IMAGE_TAG" \
    kpaiCustomDomain="$KPAI_CUSTOM_DOMAIN" \
    ytaiCustomDomain="$YTAI_CUSTOM_DOMAIN" \
    kpaiGoogleClientId="$KPAI_GOOGLE_CLIENT_ID" \
    ytaiGoogleClientId="$YTAI_GOOGLE_CLIENT_ID" \
    ytaiOpenrouterChatModel="$YTAI_OPENROUTER_CHAT_MODEL" \
    ytaiOpenrouterBaseUrl="$YTAI_OPENROUTER_BASE_URL" \
  --output none

KPAI_FQDN=$(az_output "$DEPLOYMENT_NAME" kpaiFqdn)
YTAI_FQDN=$(az_output "$DEPLOYMENT_NAME" ytaiFqdn)

cat <<EOF

==> Apps deployed.
    kpai: https://$KPAI_FQDN
    ytai: https://$YTAI_FQDN

  Migration jobs (run after the apps come up healthy):
    pnpm migrate:azure:kpai
    pnpm migrate:azure:ytai

EOF
