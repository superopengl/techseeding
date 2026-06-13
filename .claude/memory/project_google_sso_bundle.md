---
name: project-google-sso-bundle
description: "Why Google SSO buttons in kpai/ytai prod sometimes ship as \"Google sign-in (configure …_CLIENT_ID)\" placeholders, and how the release pipeline keeps it from regressing."
metadata: 
  node_type: memory
  type: project
  originSessionId: 1de6b7df-7262-4b8d-9bf8-37435b970859
---

`KPAI_GOOGLE_CLIENT_ID` and `YTAI_GOOGLE_CLIENT_ID` are injected into the React bundle by Vite's `define` at **build time** (see each app's `src/portal/vite.config.js`). The Container App's runtime env var, which `packages/deploy/scripts/deploy-apps.sh` wires up via `apps.bicep`, only feeds the API side (`POST /api/auth/google` token verification) — it cannot retro-inject the static bundle.

This has broken prod at least twice ("again on prod" on 2026-06-13). Root cause each time: the operator ran `pnpm release:kpai` / `pnpm release:ytai` without the client ID exported in the build shell, so Vite baked in `""` and the frontend rendered the disabled-state placeholder.

**Why:** there were two independent paths feeding the same variable (KV → Container App runtime; operator's shell → Vite build), and only one was reliable.

**How to apply:**
- The fix in `packages/deploy/scripts/build-and-push.sh` now pulls each client ID from Key Vault (`kpai-google-client-id` / `ytai-google-client-id`) via the new `kv_secret` helper in `common.sh` and exports it before invoking `pnpm build:prod`. Both vite configs accept a `process.env` fallback. If the SSO button regresses again, first check that this block is still in `build-and-push.sh` — someone may have refactored it out.
- KV is the single source of truth for these IDs (and matches what `seed-secrets.sh` already populates). Do not introduce a parallel `.env.production` file as a workaround.
- For an emergency manual fix without touching the pipeline: `export KPAI_GOOGLE_CLIENT_ID=$(az keyvault secret show --vault-name techseeding-kv --name kpai-google-client-id --query value -o tsv)` and re-run release. Same for ytai.
