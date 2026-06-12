#!/usr/bin/env bash
set -euo pipefail

# Release txd: build the Vite static site, sync it to S3, and invalidate the
# CloudFront cache. Thin wrapper around the existing `release` script in
# apps/txd/package.json so root-level `pnpm release:txd` matches the
# kpai/ytai entrypoints.
#
# The bucket (s3://txd-portal/) and CloudFront distribution (E1JLIDSYCZB9UH)
# are hardcoded in apps/txd/package.json — they live outside CDK and
# don't change here.
#
# Optional env:
#   AWS_PROFILE    default: txd  (override if a different profile owns the bucket/distribution)

export AWS_PROFILE="${AWS_PROFILE:-txd}"

exec pnpm -F @techseeding/txd release
