#!/usr/bin/env bash
set -euo pipefail

# Print the 4 Azure DNS nameservers for the zone, formatted for easy
# copy/paste into a domain registrar's NS-record form.
#
# Required env:
#   AZURE_DNS_ZONE   default: techseeding.com.au
#   AZURE_RG         default: techseeding-rg

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

ZONE="${AZURE_DNS_ZONE:-techseeding.com.au}"

echo "==> Azure DNS nameservers for $ZONE:"
az network dns zone show \
  --resource-group "$AZURE_RG" \
  --name "$ZONE" \
  --query "nameServers" \
  --output tsv | sed 's/^/    /'

echo ""
echo "Update your registrar's NS records to exactly these 4 hosts."
echo "Verify after a few minutes with:"
echo "    dig +short NS $ZONE @8.8.8.8"
