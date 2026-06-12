#!/usr/bin/env bash
set -euo pipefail

# Build the production Docker image for an app and push it to its ECR repo.
#
# Required env: APP (kpai|ytai)
# Optional env:
#   APP_REPO_NAME  default: $APP
#   TAG            default: latest
#   AWS_REGION     default: ap-southeast-2
#   AWS_PROFILE    default: kpai
#   DOCKERFILE     default: apps/$APP/devops/Dockerfile
#   BUILD_CMD      default: pnpm --filter ./apps/$APP build:prod
#
# Usage: APP=kpai TAG=$(git rev-parse --short HEAD) ./scripts/build-and-push.sh

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

APP="${APP:?APP must be set (kpai|ytai)}"
export AWS_PROFILE="${AWS_PROFILE:-kpai}"
TAG="${TAG:-latest}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO_NAME="${APP_REPO_NAME:-$APP}"
APP_DIR="${APP_DIR:-$REPO_ROOT/apps/$APP}"
DOCKERFILE="${DOCKERFILE:-devops/Dockerfile}"
BUILD_CMD="${BUILD_CMD:-pnpm --filter ./apps/$APP build:prod}"

REPO_URI=$(aws ecr describe-repositories \
  --repository-names "$REPO_NAME" \
  --region "$REGION" \
  --query "repositories[0].repositoryUri" \
  --output text 2>/dev/null || true)

if [ -z "$REPO_URI" ] || [ "$REPO_URI" = "None" ]; then
  echo "ERROR: ECR repository '$REPO_NAME' not found in $REGION."
  echo "       The release script creates it idempotently; run that first, or:"
  echo "         aws ecr create-repository --repository-name $REPO_NAME --region $REGION --image-scanning-configuration scanOnPush=true"
  exit 1
fi

REGISTRY="${REPO_URI%/*}"
docker_login_ecr "$REGISTRY" "$REGION"

if [ "$APP" = "ytai" ]; then
  echo "==> Building ytai image (this takes a while — ~3 GB image)"
else
  echo "==> Building $APP image (tag: $TAG)"
fi

echo "==> Building production bundle"
( cd "$REPO_ROOT" && eval "$BUILD_CMD" )

echo "==> Building Docker image"
( cd "$APP_DIR" && \
  docker buildx build \
    --platform linux/amd64 \
    -f "$DOCKERFILE" \
    -t "$REPO_URI:$TAG" \
    -t "$REPO_URI:latest" \
    --push . )

echo "==> Pushed $REPO_URI:$TAG"
