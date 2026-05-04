#!/usr/bin/env bash
set -euo pipefail

# Release: deploy the kpai ECR repo, push the app image to it, then deploy
# the app stack pinned to that image tag. Splitting the deploy in two ensures
# the image exists before the Fargate service tries to pull it.
#
# Usage: STAGE=prod pnpm release    (root task — also pre-builds dist/ and
#                                    warms the docker layer cache)
#    or: STAGE=prod ./scripts/release.sh

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO_STACK_NAME="KidPlayAi-Repo"
APP_STACK_NAME="KidPlayAi-${STAGE}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

cd "$(dirname "$0")/.."

# 1. Ensure the kpai ECR repo exists.
echo "==> Deploying repo stack: $REPO_STACK_NAME"
pnpm exec cdk deploy "$REPO_STACK_NAME" --require-approval never

# 2. Build and push the image (uses repo URI from step 1's stack output).
echo "==> Building and pushing image (tag: $TAG)"
TAG="$TAG" ./scripts/build-and-push.sh

# 3. Deploy the app stack pinned to the just-pushed tag.
echo "==> Deploying app stack: $APP_STACK_NAME"
pnpm exec cdk deploy "$APP_STACK_NAME" \
  --require-approval never \
  -c stage="$STAGE" \
  -c imageTag="$TAG"

echo ""
echo "==> Released. Tail logs with:"
echo "    aws logs tail /kidplayai/${STAGE} --follow --region ${REGION}"
