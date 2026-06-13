# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

pnpm workspace monorepo, Node 24 (see `.nvmrc`). Three product apps plus the deploy package:

```
apps/
  txd/          Vite static marketing site (Azure Static Web Apps)
  kpai/         KidPlayAI — Node/Fastify backend + React 19 + iOS SwiftUI viewer
  ytai/         YouTutorAI — Node/Fastify backend + React 19 (Konva annotation canvas)
packages/
  deploy/       Azure deploy (Bicep): Container Apps + Jobs, ACR, Postgres, Key Vault, Static Web Apps
```

App-level architecture, schemas, and conventions live in `apps/kpai/CLAUDE.md` and `apps/ytai/CLAUDE.md` — read those when working inside an app. This file covers the monorepo-level concerns.

Workspace globs (in `pnpm-workspace.yaml`): `apps/*`, `apps/*/src/portal`, `packages/*`. The catalog block at the bottom of that file is the source of truth for cross-app dep versions — when an app references `"foo": "catalog:"`, bump the catalog, not the per-app entry.

## Working in the repo

```bash
nvm use                  # picks Node 24 from .nvmrc
pnpm install             # installs every workspace
```

Per-app dev loops live in each app's own CLAUDE.md / package.json (`pnpm -F @techseeding/kidplayai start`, `pnpm -F @techseeding/yoututorai start`, etc.). Root scripts wrap deploy/release only.

## Deploy / release

```bash
pnpm bootstrap          # one-time: register Azure resource providers
pnpm deploy:infra       # az deployment sub create main.bicep (RG + every infra resource)
pnpm seed-secrets       # populate Key Vault from a local .env.azure-secrets
pnpm deploy:apps        # az deployment group create apps.bicep (Container Apps + Jobs)
pnpm release:kpai       # build + push to ACR + update Container App + run migrations
pnpm release:ytai
pnpm release:txd        # swa deploy to Azure Static Web Apps
pnpm release:all        # sequential: txd → kpai → ytai
pnpm print-ns           # 4 Azure DNS nameservers (for registrar)
```

All Bicep + scripts in `packages/deploy/`. `main.bicep` is subscription-scoped (creates RG + everything inside). `apps.bicep` is rg-scoped and depends on container images existing in ACR. Verify any Bicep edit with `az bicep build --file main.bicep` before deploying.

**Don't run `release:kpai` and `release:ytai` truly in parallel** (two terminals, background `&`): the two `az acr login` calls race on the macOS Keychain and one fails with "item already exists (-25299)". Use `release:all` (sequential), or if you need parallelism, pre-`az acr login --name techseedingacr` once then run each release with `SKIP_ACR_LOGIN=1`.

Detailed architecture (resource graph, identity model, two-pass deploy, secret flow, operational gotchas): `packages/deploy/README.md`.

## Conventions

- **No `Co-Authored-By` lines in commit messages.**
- **Don't add backwards-compat shims** when replacing code. Renames over aliases.
- When adding a workspace dep used by multiple apps, put the version in `pnpm-workspace.yaml`'s `catalog:` block and reference it via `"catalog:"` from each consumer.
