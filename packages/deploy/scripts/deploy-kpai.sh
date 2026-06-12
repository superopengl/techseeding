#!/usr/bin/env bash
set -euo pipefail

# End-to-end deploy of kpai with a forced service rollover. Same as
# release-kpai.sh but also calls `ecs update-service --force-new-deployment`
# at the end so the running tasks restart even if the image tag was reused.
#
# Usage: STAGE=prod ./scripts/deploy-kpai.sh

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

export AWS_PROFILE="${AWS_PROFILE:-kpai}"

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO_NAME="${APP_REPO_NAME:-kpai}"
APP_STACK_NAME="kpai-${STAGE}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

cd "$DEPLOY_DIR"

ensure_ecr_repo "$REPO_NAME" "$REGION"

echo "==> Building and pushing image (tag: $TAG)"
APP=kpai TAG="$TAG" APP_REPO_NAME="$REPO_NAME" ./scripts/build-and-push.sh

echo "==> Deploying app stack: $APP_STACK_NAME"
CDK_APP=kpai pnpm exec cdk deploy "$APP_STACK_NAME" \
  --require-approval never \
  -c stage="$STAGE" \
  -c imageTag="$TAG" \
  -c appRepoName="$REPO_NAME" \
  ${KPAI_CDN_CERT_ARN:+-c cdnCertificateArn="$KPAI_CDN_CERT_ARN"}

# Force ECS to roll the new task definition (idempotent — task def update from
# above already triggers a deployment, but force ensures it pulls the latest
# tag if you reused one).
SERVICE_NAME=$(cfn_output "$APP_STACK_NAME" ServiceName "$REGION")
CLUSTER_NAME=$(cfn_output "$APP_STACK_NAME" ClusterName "$REGION")

echo "==> Forcing new deployment of $SERVICE_NAME"
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --force-new-deployment \
  --region "$REGION" \
  --query "service.deployments[0].{status:status,desiredCount:desiredCount}" \
  --output table

echo "==> Done. Tail logs with:"
echo "    aws logs tail /kpai/${STAGE} --follow --region ${REGION}"
