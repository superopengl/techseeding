#!/usr/bin/env bash
set -euo pipefail

# Release: cdk deploy. CDK builds and pushes the app image as a DockerImageAsset
# during synth/deploy, so there's no separate push step. Subsequent runs only
# re-deploy when the image content (source) actually changes.
#
# Usage: STAGE=prod pnpm release    (root task — also pre-builds dist/ and
#                                    warms the docker layer cache)
#    or: STAGE=prod ./scripts/release.sh

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
STACK_NAME="KidPlayAi-${STAGE}"

cd "$(dirname "$0")/.."

# CDK deploy — provisions or updates infra; builds & pushes the container image
# as part of the stack synthesis.
echo "==> Deploying stack: $STACK_NAME"
STAGE="$STAGE" pnpm exec cdk deploy --all --require-approval never

echo ""
echo "==> Released. Tail logs with:"
echo "    aws logs tail /kidplayai/${STAGE} --follow --region ${REGION}"
