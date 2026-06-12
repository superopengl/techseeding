#!/usr/bin/env bash
set -euo pipefail

# Print a JDBC connection string for the kpai Aurora cluster, ready to paste
# into DBeaver's "Connect by URL" field. Same env-var overrides as
# scripts/db-connect.sh:
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

STAGE="${STAGE:-prod}"
STACK_NAME="${STACK_NAME:-kpai-${STAGE}}"
REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-kpai}"
DB_USER="${DB_USER:-kpai}"
DB_SECRET_ID="${DB_SECRET_ID:-kpai/${STAGE}/db}"

command -v jq  >/dev/null 2>&1 || { echo "ERROR: jq not found. brew install jq" >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "ERROR: aws CLI not found." >&2; exit 1; }

if [ -z "${DB_HOST:-}" ]; then
  DB_HOST=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='DbClusterEndpoint'].OutputValue" \
    --output text)
  if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "None" ]; then
    echo "ERROR: could not resolve DB_HOST from $STACK_NAME. Is the stack deployed?" >&2
    exit 1
  fi
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "$DB_SECRET_ID" --region "$REGION" \
    --query SecretString --output text | jq -r .password)
fi

ENC_USER=$(jq -nr --arg v "$DB_USER"     '$v | @uri')
ENC_PASS=$(jq -nr --arg v "$DB_PASSWORD" '$v | @uri')

JDBC_URL="jdbc:postgresql://${ENC_USER}:${ENC_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

cat <<EOF
==> Paste into DBeaver "Connect by URL":

${JDBC_URL}

==> Or use the separate fields:

  Host:     ${DB_HOST}
  Port:     ${DB_PORT}
  Database: ${DB_NAME}
  User:     ${DB_USER}
  Password: ${DB_PASSWORD}
  SSL Mode: require
EOF
