#!/usr/bin/env bash
set -euo pipefail

# Start an ACA Job to run database migrations. Waits for the job to complete
# and tails the logs.
#
# Required env: APP (kpai|ytai)
# Optional env:
#   AZURE_RG  default: techseeding-rg

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

require_az_login

APP="${APP:?APP must be set (kpai|ytai)}"
JOB_NAME="${APP}-migrate"

echo "==> Starting ACA Job $JOB_NAME"
EXECUTION=$(az containerapp job start \
  --name "$JOB_NAME" \
  --resource-group "$AZURE_RG" \
  --query "name" \
  --output tsv)

echo "==> Execution: $EXECUTION"
echo "==> Waiting for job to complete..."

# Poll until the execution is in a terminal state.
while true; do
  STATUS=$(az containerapp job execution show \
    --name "$JOB_NAME" \
    --resource-group "$AZURE_RG" \
    --job-execution-name "$EXECUTION" \
    --query "properties.status" \
    --output tsv 2>/dev/null || echo "Unknown")
  case "$STATUS" in
    Succeeded|Failed|Cancelled|Degraded)
      echo "==> Job $STATUS"
      break
      ;;
    *)
      echo "    status: $STATUS"
      sleep 10
      ;;
  esac
done

echo ""
echo "==> Tail logs via:"
echo "    az containerapp job logs show --name $JOB_NAME --resource-group $AZURE_RG --container $JOB_NAME --execution $EXECUTION"

if [ "$STATUS" != "Succeeded" ]; then
  exit 1
fi
