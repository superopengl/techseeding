#!/usr/bin/env bash
set -euo pipefail

# Release ytai: source prod config, ensure the ECR repo exists, push the
# merged image, fetch kpai-${STAGE}'s CFN outputs (cluster, ALB, DB, etc.),
# and deploy the ytai stack pinned to those values and the just-pushed tag.
#
# Prerequisites:
#   - kpai-${STAGE} stack is deployed (we read its CFN outputs)
#   - The ytai database exists in kpai's Aurora cluster (see bootstrap-ytai-db.sh)
#
# Usage: STAGE=prod ./scripts/release-ytai.sh
#    or: pnpm release:ytai     (from repo root — also pre-builds dist/ and the docker image)

# shellcheck source=common.sh
. "$(cd "$(dirname "$0")" && pwd)/common.sh"

export AWS_PROFILE="${AWS_PROFILE:-kpai}"

# Load prod config from apps/ytai/.env.production. The deploy reads these to
# wire the task definition:
#   YTAI_GOOGLE_CLIENT_ID, YTAI_SES_FROM_EMAIL,
#   YTAI_OPENROUTER_CHAT_MODEL, YTAI_OPENROUTER_VISION_MODEL
# Missing vars fall back to either code-side defaults or "feature off"
# (Google SSO and SES are opt-in).
#
# OPENROUTER_API_KEY / JWT / ADMIN_PASSWORD are owned by Secrets Manager,
# not sourced here.
YTAI_ENV_FILE="${REPO_ROOT}/apps/ytai/.env.production"
if [ -f "$YTAI_ENV_FILE" ]; then
  echo "==> Sourcing $YTAI_ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  . "$YTAI_ENV_FILE"
  set +a
else
  echo "==> No $YTAI_ENV_FILE found — Google SSO, SES, and model overrides will be unset."
  echo "    Copy apps/ytai/.env.sample to apps/ytai/.env.production and fill in prod values."
fi

STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO_NAME="${APP_REPO_NAME:-ytai}"
APP_STACK_NAME="ytai-${STAGE}"
KPAI_STACK_NAME="${KPAI_STACK_NAME:-kpai-${STAGE}}"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

cd "$DEPLOY_DIR"

# 1. Ensure the ytai ECR repo exists (idempotent).
ensure_ecr_repo "$REPO_NAME" "$REGION"

# 2. Build + push image.
echo "==> Building and pushing image (tag: $TAG)"
APP=ytai TAG="$TAG" APP_REPO_NAME="$REPO_NAME" ./scripts/build-and-push.sh

# 3. Read kpai stack outputs.
echo "==> Reading $KPAI_STACK_NAME outputs"
VPC_ID=$(cfn_output "$KPAI_STACK_NAME" VpcId "$REGION")
CLUSTER_NAME=$(cfn_output "$KPAI_STACK_NAME" ClusterName "$REGION")
CAPACITY_PROVIDER_NAME=$(cfn_output "$KPAI_STACK_NAME" CapacityProviderName "$REGION")
ALB_ARN=$(cfn_output "$KPAI_STACK_NAME" AlbArn "$REGION")
ALB_DNS_NAME=$(cfn_output "$KPAI_STACK_NAME" LoadBalancerDns "$REGION")
ALB_CANONICAL_HOSTED_ZONE_ID=$(cfn_output "$KPAI_STACK_NAME" AlbCanonicalHostedZoneId "$REGION")
ALB_HTTPS_LISTENER_ARN=$(cfn_output "$KPAI_STACK_NAME" AlbHttpsListenerArn "$REGION")
ALB_SG_ID=$(cfn_output "$KPAI_STACK_NAME" AlbSecurityGroupId "$REGION")
DB_HOST=$(cfn_output "$KPAI_STACK_NAME" DbClusterEndpoint "$REGION")
DB_SECRET_ARN=$(cfn_output "$KPAI_STACK_NAME" DbSecretArn "$REGION")

# 4. Deploy the ytai stack.
echo "==> Deploying $APP_STACK_NAME"
CDK_APP=ytai pnpm exec cdk deploy "$APP_STACK_NAME" \
  --require-approval never \
  -c stage="$STAGE" \
  -c imageTag="$TAG" \
  -c appRepoName="$REPO_NAME" \
  -c vpcId="$VPC_ID" \
  -c clusterName="$CLUSTER_NAME" \
  -c capacityProviderName="$CAPACITY_PROVIDER_NAME" \
  -c albArn="$ALB_ARN" \
  -c albDnsName="$ALB_DNS_NAME" \
  -c albCanonicalHostedZoneId="$ALB_CANONICAL_HOSTED_ZONE_ID" \
  -c albHttpsListenerArn="$ALB_HTTPS_LISTENER_ARN" \
  -c albSgId="$ALB_SG_ID" \
  -c dbHost="$DB_HOST" \
  -c dbSecretArn="$DB_SECRET_ARN" \
  ${YTAI_GOOGLE_CLIENT_ID:+-c googleClientId="$YTAI_GOOGLE_CLIENT_ID"} \
  ${YTAI_SES_FROM_EMAIL:+-c sesFromEmail="$YTAI_SES_FROM_EMAIL"} \
  ${YTAI_OPENROUTER_CHAT_MODEL:+-c chatModel="$YTAI_OPENROUTER_CHAT_MODEL"} \
  ${YTAI_OPENROUTER_VISION_MODEL:+-c visionModel="$YTAI_OPENROUTER_VISION_MODEL"}

echo ""
echo "==> Released. Tail logs with:"
echo "    aws logs tail /ytai/${STAGE} --follow --region ${REGION}"
