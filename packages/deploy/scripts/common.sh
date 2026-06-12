# shellcheck shell=bash
# Shared helpers for release/deploy scripts. Sourced via `. common.sh`.

# Resolve the repo root from this script's location.
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/../.." && pwd)"

# Print one named CFN output from a deployed stack. Exits 1 if the stack or
# the output is missing.
cfn_output() {
  local stack="$1" key="$2" region="${3:-${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}}"
  local v
  v=$(aws cloudformation describe-stacks \
    --stack-name "$stack" \
    --region "$region" \
    --query "Stacks[0].Outputs[?OutputKey=='$key'].OutputValue" \
    --output text 2>/dev/null || true)
  if [ -z "$v" ] || [ "$v" = "None" ]; then
    echo "ERROR: $stack has no output '$key' — is it deployed and up to date?" >&2
    return 1
  fi
  echo "$v"
}

# Create the ECR repo if it doesn't exist. Idempotent.
ensure_ecr_repo() {
  local repo="$1" region="${2:-${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}}"
  if ! aws ecr describe-repositories --repository-names "$repo" --region "$region" >/dev/null 2>&1; then
    echo "==> Creating ECR repo: $repo"
    aws ecr create-repository \
      --repository-name "$repo" \
      --region "$region" \
      --image-scanning-configuration scanOnPush=true \
      --image-tag-mutability MUTABLE >/dev/null
  fi
}

# Log in to ECR. On macOS, clears the stale keychain entry that blocks
# `docker login` overwrite without this.
docker_login_ecr() {
  local registry="$1" region="${2:-${AWS_REGION:-${CDK_DEFAULT_REGION:-ap-southeast-2}}}"
  echo "==> Logging in to ECR ($registry)"
  if [[ "${OSTYPE:-}" == darwin* ]] && command -v docker-credential-osxkeychain >/dev/null 2>&1; then
    echo "https://$registry" | docker-credential-osxkeychain erase 2>/dev/null \
      || security delete-internet-password -s "$registry" >/dev/null 2>&1 \
      || true
  fi
  docker logout "$registry" >/dev/null 2>&1 || true
  aws ecr get-login-password --region "$region" | \
    docker login --username AWS --password-stdin "$registry"
}
