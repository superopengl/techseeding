#!/usr/bin/env bash
set -euo pipefail

# Build the production Docker image and push it to the kpai ECR repository.
# Usage: TAG=$(git rev-parse --short HEAD) ./scripts/build-and-push.sh

export AWS_PROFILE="${AWS_PROFILE:-kpai}"

TAG="${TAG:-latest}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO_NAME="${APP_REPO_NAME:-kpai}"

REPO_URI=$(aws ecr describe-repositories \
  --repository-names "$REPO_NAME" \
  --region "$REGION" \
  --query "repositories[0].repositoryUri" \
  --output text 2>/dev/null || true)

if [ -z "$REPO_URI" ] || [ "$REPO_URI" = "None" ]; then
  echo "ERROR: ECR repository '$REPO_NAME' not found in $REGION."
  echo "       Create it first with:"
  echo "         aws ecr create-repository --repository-name $REPO_NAME --region $REGION --image-scanning-configuration scanOnPush=true"
  exit 1
fi

REGISTRY="${REPO_URI%/*}"

echo "==> Logging in to ECR ($REGISTRY)"
# Clear any stale credential entry so `docker login` can overwrite it.
# Without this, the macOS osxkeychain helper fails with
# "The specified item already exists in the keychain. (-25299)" — and
# `docker logout` alone doesn't help because it only edits config.json.
# Try the credential helper's erase first; fall back to the `security`
# CLI if the helper lacks ACL permission (happens when the entry was
# created by a different binary path, e.g. an older Docker Desktop).
if command -v docker-credential-osxkeychain >/dev/null 2>&1; then
  echo "https://$REGISTRY" | docker-credential-osxkeychain erase 2>/dev/null \
    || security delete-internet-password -s "$REGISTRY" >/dev/null 2>&1 \
    || true
fi
docker logout "$REGISTRY" >/dev/null 2>&1 || true
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
