# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm workspace monorepo, Node 24 (see `.nvmrc`). Three product apps plus two infra packages:

```
apps/
  txd/          Vite static marketing site (S3 + CloudFront on AWS, Static Web Apps on Azure)
  kpai/         KidPlayAI — Node/Fastify backend + React 19 + iOS SwiftUI viewer
  ytai/         YouTutorAI — Node/Fastify backend + React 19 (Konva annotation canvas)
packages/
  deploy/       Centralized AWS deploy (CDK): kpai + ytai stacks, shared bash scripts
  deploy-azure/ Azure deploy (Bicep): in progress — target replacement for AWS
```

App-level architecture, schemas, and conventions live in `apps/kpai/CLAUDE.md` and `apps/ytai/CLAUDE.md` — read those when working inside an app. This file covers the monorepo-level concerns.

Workspace globs (in `pnpm-workspace.yaml`): `apps/*`, `apps/*/src/portal`, `apps/*/deploy`, `packages/*`. The catalog block at the bottom of that file is the source of truth for cross-app dep versions — when an app references `"foo": "catalog:"`, bump the catalog, not the per-app entry.

## Working in the repo

```bash
nvm use                  # picks Node 24 from .nvmrc
pnpm install             # installs every workspace
```

Per-app dev loops live in each app's own CLAUDE.md / package.json (`pnpm -F @techseeding/kidplayai start`, `pnpm -F @techseeding/yoututorai start`, etc.). Root scripts wrap deploy/release only.

## Deploy / release

The repo is mid-migration from AWS to Azure. Both deploy targets coexist until cutover. See `packages/deploy-azure/MIGRATION_CHECKLIST.md` for the planned cutover sequence and which steps need human action.

### AWS (current production)

```bash
pnpm release:txd            # apps/txd/txd-web → aws s3 sync → cloudfront invalidate
pnpm release:kpai           # builds image, pushes to ECR, cdk deploy kpai-prod
pnpm release:ytai           # same for ytai-prod (consumes kpai's CFN outputs)
pnpm diff:kpai              # cdk diff against deployed kpai-prod
pnpm diff:ytai              # cdk diff against deployed ytai-prod
pnpm db:connect:prod        # psql shell against the shared Aurora cluster
```

All wired through `@techseeding/deploy` (`packages/deploy/`). Both CDK apps live there under `bin/{kpai,ytai}.js` + `lib/{kpai,ytai}/stack.js`; `bin/app.js` dispatches on the `CDK_APP` env var.

**Cross-stack pattern:** kpai owns the shared core (VPC, ECS cluster, ALB, Aurora). It exports ~10 CFN outputs. `scripts/release-ytai.sh` fetches them via `aws cloudformation describe-stacks` and passes them as CDK context to ytai's stack, where they're consumed via `Vpc.fromVpcAttributes()` / `from*Attributes()` constructors. **Never use `Fn.importValue` here** — that creates ARM-level dependency lock-in. The CLI-fetch-then-context pattern is the convention.

### Azure (target)

```bash
pnpm azure:bootstrap        # one-time: register Azure resource providers
pnpm azure:deploy:infra     # az deployment sub create main.bicep (RG + everything)
pnpm azure:seed-secrets     # populate Key Vault from a local .env.azure-secrets
pnpm azure:deploy:apps      # az deployment group create apps.bicep (Container Apps + Jobs)
pnpm release:azure:kpai     # build + push to ACR + update Container App + run migrations
pnpm release:azure:ytai
pnpm release:azure:txd      # swa deploy to Azure Static Web Apps
pnpm azure:print-ns         # 4 Azure DNS nameservers (for registrar update)
```

All Bicep + scripts in `packages/deploy-azure/`. `main.bicep` is subscription-scoped (creates RG + everything inside). `apps.bicep` is rg-scoped and depends on container images existing in ACR. Verify any Bicep edit with `az bicep build --file main.bicep` before deploying.

## Conventions

- **No `Co-Authored-By` lines in commit messages.**
- **Don't add backwards-compat shims** when replacing code. Renames over aliases. The S3 → Blob swap in ytai is the canonical example: `s3.js` was deleted and `isS3Enabled()` renamed to `isBlobEnabled()`, with all callers updated in the same commit.
- **CFN stack names and resource logical IDs in `packages/deploy/lib/{kpai,ytai}/stack.js` are load-bearing** — changing them triggers CloudFormation resource recreation (RDS = data loss, EC2 = downtime). Run `pnpm diff:kpai` / `pnpm diff:ytai` before any deploy-package change touches the stack files.
- When adding a workspace dep used by multiple apps, put the version in `pnpm-workspace.yaml`'s `catalog:` block and reference it via `"catalog:"` from each consumer.
