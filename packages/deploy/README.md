# `@techseeding/deploy`

Bicep + bash for running the techseeding monorepo on Azure: txd as a Static Web App, kpai + ytai as Azure Container Apps backed by a shared Postgres Flexible Server, ACR for images, Key Vault for secrets, and ACS Email for OTP delivery.

## Resource layout

Single resource group, single region (`australiaeast` for everything except the Static Web App which is `eastasia` — SWA's smallest control-plane region near AU).

```mermaid
graph TD
  subgraph rg["techseeding-rg (australiaeast)"]
    subgraph env["techseeding-env (ACA Environment, non-VNet Consumption)"]
      kpaiApp["kpai<br/>Container App"]
      ytaiApp["ytai<br/>Container App"]
      kpaiMig["kpai-migrate<br/>ACA Job"]
      ytaiMig["ytai-migrate<br/>ACA Job"]
    end

    pg["techseeding-pg<br/>Postgres Flex B1ms<br/>public endpoint + AllowAllAzureServices<br/>(dbs: kpai, ytai)"]
    acr["techseedingacr<br/>ACR Basic"]
    kv["techseeding-kv<br/>Key Vault (RBAC)"]
    sa["techseedingsa<br/>Storage Account<br/>(blob: ytai-images, txd-static<br/>file share: kpai-sandboxes)"]
    logs["techseeding-logs<br/>Log Analytics"]
    acs["techseeding-acs + email<br/>(ACS Email)"]
    dns["techseeding.com.au<br/>(Azure DNS zone)"]
    uami["techseeding-apps-id<br/>(User-Assigned MI)"]
    txd["techseeding-txd<br/>Static Web App (eastasia)"]

    env -.image pull.-> acr
    env -.secrets.-> kv
    env -.blob + files.-> sa
    env -.logs.-> logs
    env -.public endpoint over Azure backbone.-> pg

    kpaiApp -.ACS Email.-> acs
    ytaiApp -.ACS Email.-> acs

    uami -- AcrPull --> acr
    uami -- Key Vault Secrets User --> kv
    uami -- Storage Blob Data Contributor --> sa
    env -. identity .-> uami
  end
```

## Identity model — User-Assigned MI

Every Container App + Job attaches the **same** User-Assigned Managed Identity (`techseeding-apps-id`). That UAMI has its RBAC granted at infra-deploy time:

- `AcrPull` on ACR — so apps can pull their images
- `Key Vault Secrets User` on KV — so ACA secret refs can fetch values
- `Storage Blob Data Contributor` on the storage account — so ytai can read/write blobs via `DefaultAzureCredential`

**Why UAMI, not system-assigned MI per app:** system MI's `principalId` only exists after the app provisions, but the app can't provision its first revision without already having `AcrPull`. Classic chicken-and-egg. UAMI created up front with RBAC pre-assigned breaks the cycle.

## Two-pass deploy

Infra and apps deploy from two separate Bicep templates:

1. **`main.bicep`** (subscription scope, via `pnpm azure:deploy:infra`)
   - Creates the resource group + every infra resource: Log Analytics, ACR, Postgres, Storage, KV, DNS zone, ACS, ACA Environment, UAMI, Static Web App
   - Does not need container images to exist yet
   - Outputs: ACR login server, Postgres FQDN, KV URI, ACA env id, storage blob endpoint, ACS sender, UAMI id
2. **`apps.bicep`** (resource-group scope, via `pnpm azure:deploy:apps`)
   - Creates the Container Apps + ACA Jobs + their env-var wiring
   - Requires images already in ACR — pass tags via `KPAI_IMAGE_TAG` / `YTAI_IMAGE_TAG`
   - Consumes main's outputs as parameters (`uamiId`, `keyVaultUri`, `postgresFqdn`, etc.)

The script `deploy-apps.sh` auto-discovers main's outputs if you pass `AZURE_DEPLOYMENT_NAME=<name>` of a prior main deploy.

## Secret flow

```
Key Vault (techseeding-kv)
   ↑                                          ┌─ KPAI_JWT_SECRET (env via secretRef)
   │ seed-secrets.sh reads .env.azure-secrets │
   │ and writes:                               │  Container App secret
   │   kpai-jwt-secret                         │    keyVaultUrl=https://kv../secrets/kpai-jwt-secret
   │   kpai-sandbox-deepseek-api-key           ├─→ identity=<UAMI id>
   │   …                                       │
                                               └─ resolved at revision start → injected as env
```

KV holds the raw values. Each Container App declares "Container Apps secrets" that reference the KV URIs and authenticate via the UAMI. Env vars use `secretRef` to expose those secrets to the container at runtime.

DB connection: apps' entrypoints compose `${APP}_DATABASE_URL` from `PG_HOST` (plain env from Bicep) + `PG_PASSWORD` (KV secret ref) + plain `PG_USER`/`PG_PORT`/`PG_DATABASE`. The kpai entrypoint adds `?sslmode=require` because Postgres Flex Server rejects unencrypted connections.

## Network

- **Apps**: external HTTPS ingress on each Container App (Azure-managed FQDN). No ALB equivalent needed.
- **Postgres**: public endpoint with the `AllowAllAzureServices` firewall rule (start=end=0.0.0.0). Only callers with the admin password (in KV) can connect; traffic from ACA → Postgres rides Azure's regional backbone, not the public internet. To run psql from a laptop, add a temporary firewall rule via `params/prod.bicepparam` (`extraFirewallRules`) for your IP, or use an ACA Job.
- **KV / Storage / ACR**: public endpoints with `defaultAction: Allow`. Tighten to private endpoints if compliance ever demands it — would require reintroducing a VNet.

**Why no VNet:** ACA Consumption profile with VNet integration provisions a managed Standard Load Balancer + Public IP (~$20+/mo idle) and charges higher per-vCPU-second rates. For a two-app workload where Postgres is the only thing that benefits from private networking, the AllowAllAzureServices + KV-stored password model is the cheaper, simpler default. Reintroduce a VNet if you need private endpoints, on-prem hybrid connectivity, or stricter egress controls.

## Release workflow

```bash
pnpm azure:bootstrap         # one-time: az provider register …
pnpm azure:deploy:infra      # main.bicep — RG + every infra resource
pnpm azure:seed-secrets      # .env.azure-secrets → KV
pnpm release:azure:kpai      # build & push image, az containerapp update, run kpai-migrate Job
pnpm release:azure:ytai      # same for ytai
pnpm release:azure:txd       # vite build → swa deploy

# Or to deploy apps without rebuilding images:
pnpm azure:deploy:apps       # apps.bicep — Container Apps + Jobs only
```

`apps.bicep` is parameterized on image tag, custom domain, and the optional model/Google-client overrides — re-running it is the safe way to make a configuration change.

## Operational gotchas

- **ACS Email API versions** churn fast. Stick to GA versions (e.g. `2025-09-01`); avoid `*-preview` unless you know it's published.
- **Key Vault purge protection** is tenant-policy-enforced — `enablePurgeProtection: false` is rejected. Once you enable it (which we do), the vault name is reserved for the soft-delete retention window after any deletion.
- **ACS Email custom domain** can be *declared* immediately but **only links** to the ACS resource after DNS verification (DKIM/SPF/DMARC TXT records). `linkCustomDomain` defaults `false`; flip it after the registrar NS update propagates.
- **ACA Consumption profile** requires specific CPU:memory pairings (1:2 ratio). 1.0/4Gi is rejected; use 2.0/4Gi.
- **Static Web Apps** only deploy in 5 regions: centralus, eastus2, westus2, westeurope, eastasia. AU East is not supported. Content is CDN-served globally so the resource region only matters for the control plane.
- **In-place region change for SWA** isn't allowed — delete and recreate (the default hostname changes).
- **Postgres Flex Server network mode is immutable.** You can't switch a VNet-integrated server to public access (or vice versa) in-place — it requires destroying and recreating the server.
- **ACA Environment VNet config is immutable.** Toggling `vnetConfiguration` on an existing environment requires recreating the environment (and therefore re-binding every Container App).
- **Container Apps cache KV-referenced secrets** at revision-activation time. Rotating a KV value alone won't propagate — you must also force a new revision (`az containerapp update --revision-suffix …`).
- **kpai + ytai run always-warm (`minReplicas: 1`).** Scale-to-zero (`minReplicas: 0`) saves ~$33/mo per app but makes the first request after an idle period pay a ~20s cold-start. We keep one replica always on because we have Azure credits to spare and the latency isn't worth the savings. The setting lives in `apps.bicep`; apply a change with `pnpm deploy:apps` (a `release:*` only swaps the image and leaves scale untouched).

## Files

- `main.bicep` — subscription-scope, RG + every infra resource
- `apps.bicep` — RG-scope, Container Apps + Jobs
- `modules/` — one file per resource type
- `params/prod.bicepparam` — env-driven params (passwords + principal IDs from `.env.azure-deploy`, gitignored)
- `scripts/` — orchestration bash: bootstrap, deploy-all, deploy-apps, seed-secrets, build-and-push, migrate, release-{kpai,ytai,txd}, print-ns-records
