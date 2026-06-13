# shellcheck shell=bash
# Shared helpers for Azure deploy scripts. Sourced via `. common.sh`.

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"

AZURE_LOCATION="${AZURE_LOCATION:-australiaeast}"
AZURE_RG="${AZURE_RG:-techseeding-rg}"

# Read a top-level output from a previous `az deployment ...` invocation.
az_output() {
  local deployment_name="$1" output_key="$2" scope="${3:-rg}"
  if [ "$scope" = "sub" ]; then
    az deployment sub show \
      --name "$deployment_name" \
      --query "properties.outputs.${output_key}.value" \
      --output tsv 2>/dev/null
  else
    az deployment group show \
      --resource-group "$AZURE_RG" \
      --name "$deployment_name" \
      --query "properties.outputs.${output_key}.value" \
      --output tsv 2>/dev/null
  fi
}

# Verify the operator is logged in to the right subscription.
require_az_login() {
  if ! az account show >/dev/null 2>&1; then
    echo "ERROR: not logged in. Run 'az login' first." >&2
    exit 1
  fi
  local sub
  sub=$(az account show --query name --output tsv)
  echo "==> Using Azure subscription: $sub"
}

# Some role assignments take a few seconds to propagate before the granted
# principal can use them. Sleep + best-effort retry pattern.
wait_role_propagation() {
  echo "==> Waiting 30s for RBAC propagation"
  sleep 30
}
