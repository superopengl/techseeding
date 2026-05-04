#!/usr/bin/env bash
set -euo pipefail

# End-to-end release: cdk deploy → push the locally-built image to ECR → force Fargate redeploy.
# Expects the local image `techseeding/kidplayai:latest` to already exist (linux/amd64).
# Usage: STAGE=prod pnpm release   (root task; builds the image first)
#    or: STAGE=prod ./scripts/release.sh   (assumes image already built)

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
STACK_NAME="KidPlayAi-${STAGE}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
LOCAL_IMAGE="techseeding/kidplayai:latest"

cd "$(dirname "$0")/.."

if ! docker image inspect "$LOCAL_IMAGE" >/dev/null 2>&1; then
  echo "ERROR: local image $LOCAL_IMAGE not found." >&2
  echo "       Run \"pnpm release\" from the repo root (it builds first), or run \"pnpm build:docker\" before this script." >&2
  exit 1
fi

# 1. CDK deploy — provisions or updates infra (idempotent)
echo "==> [1/4] Deploying infra: $STACK_NAME"
STAGE="$STAGE" pnpm exec cdk deploy --all --require-approval never

# 2. Resolve ECR repo URI from stack outputs
REPO_URI=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" --output text)
REGISTRY="${REPO_URI%/*}"

# 3. Push local image to ECR (no rebuild)
echo "==> [2/4] Logging in to ECR ($REGISTRY)"
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$REGISTRY"

echo "==> [3/4] Tagging and pushing $LOCAL_IMAGE → $REPO_URI:$TAG"
docker tag "$LOCAL_IMAGE" "$REPO_URI:$TAG"
docker tag "$LOCAL_IMAGE" "$REPO_URI:latest"
docker push "$REPO_URI:$TAG"
docker push "$REPO_URI:latest"

# 4. Force Fargate to pull the new image
SERVICE_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ServiceName'].OutputValue" --output text)
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ClusterName'].OutputValue" --output text)

echo "==> [4/4] Forcing new deployment of $SERVICE_NAME"
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --force-new-deployment \
  --region "$REGION" \
  --query "service.deployments[0].{status:status,desiredCount:desiredCount}" \
  --output table

echo ""
echo "==> Released. Tail logs with:"
echo "    aws logs tail /kidplayai/${STAGE} --follow --region ${REGION}"
