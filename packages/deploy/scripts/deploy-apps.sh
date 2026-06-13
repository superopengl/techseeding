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
#   KPAI_ACS_SENDER           default: kidplayai@techseeding.com.au
#   YTAI_ACS_SENDER           default: yoututorai@techseeding.com.au
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
  : "${AZURE_UAMI_ID:=$(az_output "$AZURE_DEPLOYMENT_NAME" uamiId sub)}"
fi

# Per-app sender addresses. Local-part must match a sender username on the
# verified ACS custom domain (declared in acs-email.bicep + main.bicep).
: "${KPAI_ACS_SENDER:=kidplayai@techseeding.com.au}"
: "${YTAI_ACS_SENDER:=yoututorai@techseeding.com.au}"

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
    uamiId="$AZURE_UAMI_ID" \
    keyVaultUri="$AZURE_KV_URI" \
    storageBlobEndpoint="$AZURE_STORAGE_BLOB_ENDPOINT" \
    postgresFqdn="$AZURE_PG_FQDN" \
    kpaiAcsSender="$KPAI_ACS_SENDER" \
    ytaiAcsSender="$YTAI_ACS_SENDER" \
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
