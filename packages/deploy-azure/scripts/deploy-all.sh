#!/usr/bin/env bash
set -euo pipefail

# Phase A bring-up: deploy main.bicep at subscription scope. Creates the
# resource group and every non-image-dependent resource (VNet, ACR, KV,
# Postgres, Storage, DNS zone, ACS Email, ACA Environment, Static Web App).
#
# Required env (or use a local .env.azure-deploy file, gitignored):
#   AZURE_PG_ADMIN_PASSWORD       — pick any strong password; gets baked into Postgres
#   AZURE_KV_ADMIN_PRINCIPAL_ID   — your `az ad signed-in-user show --query id -o tsv`
#                                   (optional; without it, seed-secrets.sh will need
#                                   you to grant yourself Key Vault Secrets Officer
#                                   manually)
#
# Optional env:
#   AZURE_LOCATION                — default: australiaeast
#   AZURE_RG                      — default: techseeding-rg
#   AZURE_DEPLOYMENT_NAME         — default: techseeding-main-<date>

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

# Allow a local .env.azure-deploy to provide the passwords / object IDs.
ENV_FILE="${DEPLOY_DIR}/.env.azure-deploy"
if [ -f "$ENV_FILE" ]; then
  echo "==> Sourcing $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if [ -z "${AZURE_PG_ADMIN_PASSWORD:-}" ]; then
  echo "ERROR: AZURE_PG_ADMIN_PASSWORD is not set." >&2
  echo "  export AZURE_PG_ADMIN_PASSWORD=\$(openssl rand -hex 24)" >&2
  echo "  (and stash it in your password manager — Bicep won't surface it again)" >&2
  exit 1
fi

DEPLOYMENT_NAME="${AZURE_DEPLOYMENT_NAME:-techseeding-main-$(date +%Y%m%d-%H%M%S)}"

echo "==> Deploying main.bicep at subscription scope"
echo "    Location:    $AZURE_LOCATION"
echo "    Deployment:  $DEPLOYMENT_NAME"

cd "$DEPLOY_DIR"

az deployment sub create \
  --name "$DEPLOYMENT_NAME" \
  --location "$AZURE_LOCATION" \
  --template-file main.bicep \
  --parameters params/prod.bicepparam \
  --output none

echo ""
echo "==> Deployment complete. Key outputs:"

NS=$(az_output "$DEPLOYMENT_NAME" "dnsNameServers" sub | tr -d '"[]')
ACR_LOGIN=$(az_output "$DEPLOYMENT_NAME" "acrLoginServer" sub)
PG_FQDN=$(az_output "$DEPLOYMENT_NAME" "postgresFqdn" sub)
KV_NAME=$(az_output "$DEPLOYMENT_NAME" "keyVaultName" sub)
ACS_MANAGED=$(az_output "$DEPLOYMENT_NAME" "acsManagedDomainSender" sub)
STATIC_HOST=$(az_output "$DEPLOYMENT_NAME" "staticWebAppHostname" sub)

cat <<EOF

  Resource group:     $AZURE_RG
  ACR login server:   $ACR_LOGIN
  Postgres FQDN:      $PG_FQDN
  Key Vault:          $KV_NAME
  Static Web App:     https://$STATIC_HOST
  ACS managed sender: donotreply@$ACS_MANAGED  (use until custom domain verified)

  Azure DNS nameservers — point your registrar at these:
$(echo "$NS" | tr ',' '\n' | sed 's/^/    - /')

  Stash AZURE_PG_ADMIN_PASSWORD into Key Vault now:
    az keyvault secret set --vault-name $KV_NAME --name pg-admin-password --value "\$AZURE_PG_ADMIN_PASSWORD"

  Next steps:
    1. Update registrar NS records (MIGRATION_CHECKLIST.md §1)
    2. Run scripts/seed-secrets.sh to populate the other secret slots
    3. Build + push images: pnpm release:azure:kpai / release:azure:ytai
    4. Run scripts/deploy-apps.sh to create the Container Apps

EOF
