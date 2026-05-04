#!/usr/bin/env bash
set -euo pipefail

# Build the production Docker image and push it to ECR.
# Usage: STAGE=prod TAG=$(git rev-parse --short HEAD) ./scripts/build-and-push.sh

STAGE="${STAGE:-prod}"
TAG="${TAG:-latest}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
STACK_NAME="KidPlayAi-${STAGE}"

REPO_URI=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" \
  --output text)

if [ -z "$REPO_URI" ] || [ "$REPO_URI" = "None" ]; then
  echo "ERROR: ECR repository not found. Run 'pnpm deploy' first to create infra."
  exit 1
fi

REGISTRY="${REPO_URI%/*}"

echo "==> Logging in to ECR ($REGISTRY)"
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$REGISTRY"

echo "==> Building production bundle"
( cd "$(dirname "$0")/../.." && pnpm build:prod )

echo "==> Building Docker image"
( cd "$(dirname "$0")/../.." && \
  docker buildx build \
    --platform linux/amd64 \
    -f devops/Dockerfile \
    -t "$REPO_URI:$TAG" \
    -t "$REPO_URI:latest" \
    --push . )

echo "==> Pushed $REPO_URI:$TAG"
