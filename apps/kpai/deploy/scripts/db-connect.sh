#!/usr/bin/env bash
set -euo pipefail

# Open a psql shell against the kpai Aurora cluster, using SSL verify-full.
# Everything is auto-discovered from CloudFormation / Secrets Manager but can
# be overridden via env vars:
#
#   STAGE          (default: prod)
#   STACK_NAME     (default: kpai-${STAGE})
#   AWS_REGION     (default: ap-southeast-2)
#   DB_HOST        (default: stack output 'DbClusterEndpoint')
#   DB_PORT        (default: 5432)
#   DB_NAME        (default: kpai)
#   DB_USER        (default: kpai)
#   DB_SECRET_ID   (default: kpai/${STAGE}/db)
#   DB_PASSWORD    (default: 'password' field of secret DB_SECRET_ID)
#   CA_BUNDLE      (default: ~/.cache/aws-rds-global-bundle.pem; downloaded if missing)
#
# Examples:
#   pnpm db:connect                          # prod
#   STAGE=staging pnpm db:connect            # different stack
#   DB_USER=readonly pnpm db:connect         # different user

STAGE="${STAGE:-prod}"
STACK_NAME="${STACK_NAME:-kpai-${STAGE}}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-kpai}"
DB_USER="${DB_USER:-kpai}"
DB_SECRET_ID="${DB_SECRET_ID:-kpai/${STAGE}/db}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql not found. Install it: brew install libpq && brew link --force libpq"; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo "ERROR: jq not found. Install it: brew install jq"; exit 1; }
command -v aws  >/dev/null 2>&1 || { echo "ERROR: aws CLI not found."; exit 1; }

if [ -z "${DB_HOST:-}" ]; then
  echo "==> Looking up cluster endpoint from $STACK_NAME"
  DB_HOST=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='DbClusterEndpoint'].OutputValue" \
    --output text)
  if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "None" ]; then
    echo "ERROR: could not resolve DB_HOST from $STACK_NAME. Is the stack deployed?"
    exit 1
  fi
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "==> Fetching password from secret $DB_SECRET_ID"
  DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "$DB_SECRET_ID" --region "$REGION" \
    --query SecretString --output text | jq -r .password)
fi

CA_BUNDLE="${CA_BUNDLE:-$HOME/.cache/aws-rds-global-bundle.pem}"
mkdir -p "$(dirname "$CA_BUNDLE")"
if [ ! -f "$CA_BUNDLE" ]; then
  echo "==> Downloading RDS CA bundle to $CA_BUNDLE"
  curl -fsSL -o "$CA_BUNDLE" https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
fi

echo "==> Connecting to $DB_HOST as $DB_USER (db: $DB_NAME)"
PGPASSWORD="$DB_PASSWORD" exec psql \
  "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER sslmode=verify-full sslrootcert=$CA_BUNDLE"
