#!/usr/bin/env bash
set -euo pipefail

# Release kpai: ensure the ECR repo exists, push the image, deploy the stack
# pinned to that tag. The repo is managed outside CDK so image history
# survives any teardown of the app stack.
#
# Usage: STAGE=prod ./scripts/release-kpai.sh
#    or: pnpm release:kpai     (from repo root — also pre-builds dist/ and the docker image)

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

# Default to the kpai IAM profile so direct invocations don't fall back to
# whatever happens to be the shell default (often a less-privileged user).
export AWS_PROFILE="${AWS_PROFILE:-kpai}"

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO_NAME="${APP_REPO_NAME:-kpai}"
APP_STACK_NAME="kpai-${STAGE}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

cd "$DEPLOY_DIR"

# 1. Ensure the kpai ECR repo exists (idempotent).
ensure_ecr_repo "$REPO_NAME" "$REGION"

# 2. Build and push the image.
echo "==> Building and pushing image (tag: $TAG)"
APP=kpai TAG="$TAG" APP_REPO_NAME="$REPO_NAME" ./scripts/build-and-push.sh

# 3. Deploy the app stack pinned to the just-pushed tag.
echo "==> Deploying app stack: $APP_STACK_NAME"
CDK_APP=kpai pnpm exec cdk deploy "$APP_STACK_NAME" \
  --require-approval never \
  -c stage="$STAGE" \
  -c imageTag="$TAG" \
  -c appRepoName="$REPO_NAME" \
  -c dbPubliclyAccessible="${KPAI_DB_PUBLICLY_ACCESSIBLE:-false}" \
  ${KPAI_CDN_CERT_ARN:+-c cdnCertificateArn="$KPAI_CDN_CERT_ARN"}

echo ""
echo "==> Released. Tail logs with:"
echo "    aws logs tail /kpai/${STAGE} --follow --region ${REGION}"
