#!/usr/bin/env bash
set -euo pipefail

# End-to-end deploy: build image, push to ECR, force Fargate to redeploy.
# Usage: STAGE=prod ./scripts/deploy.sh

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
STACK_NAME="KidPlayAi-${STAGE}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

cd "$(dirname "$0")/.."

# 1. CDK deploy (idempotent — provisions or updates infra)
echo "==> Deploying infra stack: $STACK_NAME"
STAGE="$STAGE" TAG="$TAG" pnpm exec cdk deploy --all --require-approval never

# 2. Build + push image (depends on ECR repo from step 1)
echo "==> Building and pushing image (tag: $TAG)"
STAGE="$STAGE" TAG="$TAG" ./scripts/build-and-push.sh

# 3. Force Fargate service to pull the new image
SERVICE_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ServiceName'].OutputValue" \
  --output text)
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
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
echo "    aws logs tail /kidplayai/${STAGE} --follow --region ${REGION}"
