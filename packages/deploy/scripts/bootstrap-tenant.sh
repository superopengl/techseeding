#!/usr/bin/env bash
set -euo pipefail

# One-time prep: register the Azure resource providers we need. Idempotent —
# safe to rerun. Run this AFTER `az login` and AFTER setting the active
# subscription, but BEFORE the first `deploy-all.sh`.

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

providers=(
  Microsoft.App
  Microsoft.ContainerRegistry
  Microsoft.DBforPostgreSQL
  Microsoft.KeyVault
  Microsoft.Storage
  Microsoft.OperationalInsights
  Microsoft.Network
  Microsoft.Communication
  Microsoft.Web
  Microsoft.Authorization
  Microsoft.Resources
)

for p in "${providers[@]}"; do
  echo "==> Registering $p"
  az provider register --namespace "$p" --wait
done

echo ""
echo "==> Providers registered. You can now run:"
echo "      ./scripts/deploy-all.sh"
