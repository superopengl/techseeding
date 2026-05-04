#!/usr/bin/env bash
set -euo pipefail

# End-to-end deploy: deploy the kpai ECR repo, push the image, then deploy
# the app stack pinned to that image tag.
# Usage: STAGE=prod ./scripts/deploy.sh

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO_NAME="${APP_REPO_NAME:-kpai}"
APP_STACK_NAME="kpai-${STAGE}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

cd "$(dirname "$0")/.."

# 1. Ensure the kpai ECR repo exists (idempotent).
if ! aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "==> Creating ECR repo: $REPO_NAME"
  aws ecr create-repository \
    --repository-name "$REPO_NAME" \
    --region "$REGION" \
    --image-scanning-configuration scanOnPush=true \
    --image-tag-mutability MUTABLE >/dev/null
fi

# 2. Build + push image.
echo "==> Building and pushing image (tag: $TAG)"
TAG="$TAG" APP_REPO_NAME="$REPO_NAME" ./scripts/build-and-push.sh

# 3. Deploy the app stack pinned to the just-pushed tag.
echo "==> Deploying app stack: $APP_STACK_NAME"
pnpm exec cdk deploy "$APP_STACK_NAME" \
  --require-approval never \
  -c stage="$STAGE" \
  -c imageTag="$TAG" \
  -c appRepoName="$REPO_NAME"

# 4. Force Fargate to roll the new task definition (idempotent — task def
#    update from step 3 already triggers a deployment, but force ensures it
#    pulls the latest tag if you reused one).
SERVICE_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$APP_STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ServiceName'].OutputValue" \
  --output text)
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$APP_STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" \
  --output text)

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
