#!/usr/bin/env bash
set -euo pipefail

# Apply a "keep last N images" lifecycle policy to an app's ECR repo.
# Idempotent — rerunning replaces the policy. ytai's image is ~3 GB so the
# repo grows quickly without this.
#
# Required env: APP_REPO_NAME (e.g. kpai or ytai)
# Optional env:
#   AWS_REGION     default: ap-southeast-2
#   AWS_PROFILE    default: kpai
#   KEEP_COUNT     default: 3

export AWS_PROFILE="${AWS_PROFILE:-kpai}"

REGION="${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}"
REPO="${APP_REPO_NAME:?APP_REPO_NAME must be set (e.g. kpai|ytai)}"
KEEP="${KEEP_COUNT:-3}"

POLICY=$(cat <<EOF
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last ${KEEP} images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": ${KEEP}
      },
      "action": { "type": "expire" }
    }
  ]
}
EOF
)

echo "==> Applying lifecycle policy to ECR repo '$REPO' (keep last $KEEP) in $REGION"
aws ecr put-lifecycle-policy \
  --repository-name "$REPO" \
  --lifecycle-policy-text "$POLICY" \
  --region "$REGION" \
  --output table
