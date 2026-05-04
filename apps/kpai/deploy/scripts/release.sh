#!/usr/bin/env bash
set -euo pipefail

# Release: ensure the kpai ECR repo exists, push the app image, then deploy
# the app stack pinned to that image tag. The repo is managed outside CDK so
# image history survives any teardown of the app stack.
#
# Usage: STAGE=prod pnpm release    (root task — also pre-builds dist/ and
#                                    warms the docker layer cache)
#    or: STAGE=prod ./scripts/release.sh

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

# 2. Build and push the image.
echo "==> Building and pushing image (tag: $TAG)"
TAG="$TAG" APP_REPO_NAME="$REPO_NAME" ./scripts/build-and-push.sh

# 3. Deploy the app stack pinned to the just-pushed tag.
echo "==> Deploying app stack: $APP_STACK_NAME"
pnpm exec cdk deploy "$APP_STACK_NAME" \
  --require-approval never \
  -c stage="$STAGE" \
  -c imageTag="$TAG" \
  -c appRepoName="$REPO_NAME"

echo ""
echo "==> Released. Tail logs with:"
echo "    aws logs tail /kpai/${STAGE} --follow --region ${REGION}"
