#!/usr/bin/env bash
set -euo pipefail

# Manually trigger a one-off ECS task that runs the app's migration command.
# Normally migrations run on container start (RUN_MIGRATIONS=true for kpai),
# but use this when you want to apply migrations without a full service
# redeploy.
#
# Required env: APP (kpai|ytai)
# Optional env:
#   STAGE             default: prod
#   AWS_REGION        default: ap-southeast-2
#   AWS_PROFILE       default: kpai
#   CLUSTER_STACK     default: kpai-${STAGE}        (both apps share kpai's cluster)
#   SERVICE_STACK     default: ${APP}-${STAGE}
#   MIGRATE_COMMAND   default: app-specific (see below)
#   EXTRA_ENV         default: app-specific (see below)
#
# Defaults:
#   kpai → MIGRATE_COMMAND=["npx","drizzle-kit","migrate","--config","src/api/drizzle.config.js"]
#          EXTRA_ENV=[{"name":"RUN_MIGRATIONS","value":"false"}]
#   ytai → MIGRATE_COMMAND=["node","dist/src/api/db/migrate.js"]
#          EXTRA_ENV=[]
#
# Usage: APP=kpai STAGE=prod ./scripts/run-migration.sh

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

APP="${APP:?APP must be set (kpai|ytai)}"
export AWS_PROFILE="${AWS_PROFILE:-kpai}"
STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
CLUSTER_STACK="${CLUSTER_STACK:-kpai-${STAGE}}"
SERVICE_STACK="${SERVICE_STACK:-${APP}-${STAGE}}"

case "$APP" in
  kpai)
    MIGRATE_COMMAND="${MIGRATE_COMMAND:-[\"npx\",\"drizzle-kit\",\"migrate\",\"--config\",\"src/api/drizzle.config.js\"]}"
    EXTRA_ENV="${EXTRA_ENV:-[{\"name\":\"RUN_MIGRATIONS\",\"value\":\"false\"}]}"
    ;;
  ytai)
    MIGRATE_COMMAND="${MIGRATE_COMMAND:-[\"node\",\"dist/src/api/db/migrate.js\"]}"
    EXTRA_ENV="${EXTRA_ENV:-[]}"
    ;;
  *)
    echo "ERROR: unknown APP '$APP' (expected kpai|ytai)" >&2
    exit 1
    ;;
esac

CLUSTER_NAME=$(cfn_output "$CLUSTER_STACK" ClusterName "$REGION")
SERVICE_NAME=$(cfn_output "$SERVICE_STACK" ServiceName "$REGION")

TASK_DEF=$(aws ecs describe-services \
  --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --region "$REGION" \
  --query "services[0].taskDefinition" --output text)

OVERRIDES=$(cat <<EOF
{"containerOverrides":[{"name":"App","command":${MIGRATE_COMMAND},"environment":${EXTRA_ENV}}]}
EOF
)

echo "==> Running $APP migration task on $CLUSTER_NAME"
TASK_ARN=$(aws ecs run-task \
  --cluster "$CLUSTER_NAME" \
  --task-definition "$TASK_DEF" \
  --launch-type EC2 \
  --overrides "$OVERRIDES" \
  --region "$REGION" \
  --query "tasks[0].taskArn" --output text)

echo "==> Task: $TASK_ARN"
echo "==> Waiting for task to stop..."
aws ecs wait tasks-stopped --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --region "$REGION"

EXIT_CODE=$(aws ecs describe-tasks \
  --cluster "$CLUSTER_NAME" --tasks "$TASK_ARN" --region "$REGION" \
  --query "tasks[0].containers[0].exitCode" --output text)

echo "==> Task exited with code: $EXIT_CODE"
exit "$EXIT_CODE"
