# AWS → Azure migration: manual checklist

Things the deploy scripts can't do for you. Work through them roughly in
order — later steps depend on earlier ones (DNS authority must land before
managed certs validate; secrets must be in Key Vault before the apps can
start).

## 0. Prerequisites (one-time, before Phase A)

- [ ] **Pick / create an Azure subscription.** Note the subscription ID.
- [ ] **Install `az` CLI** locally (`brew install azure-cli`) and run
  `az login`. Confirm `az account show` reports the right subscription
  (`az account set --subscription <id>` if needed).
- [ ] **Grant your CLI principal RBAC on the target scope:** at minimum
  `Contributor` + `User Access Administrator` on the subscription (or on
  the resource group once it exists). Without UAA, Bicep can't create the
  role assignments that wire ACA → Key Vault, ACA → Storage, ACA → ACR.
- [ ] **Register required resource providers** (idempotent):
  ```bash
  for p in Microsoft.App Microsoft.ContainerRegistry Microsoft.DBforPostgreSQL \
           Microsoft.KeyVault Microsoft.Storage Microsoft.OperationalInsights \
           Microsoft.Network Microsoft.Communication Microsoft.Web; do
    az provider register --namespace "$p"
  done
  ```

## 1. After Phase A (infra deploy) — DNS authority

- [ ] **Get the 4 Azure DNS NS records** the bootstrap deploy outputs.
  They look like `ns1-XX.azure-dns.com`, `ns2-XX.azure-dns.net`,
  `ns3-XX.azure-dns.org`, `ns4-XX.azure-dns.info`.
- [ ] **Update the NS records at the domain registrar** for
  `techseeding.com.au`. Wherever you bought the domain (registrar,
  AWS Route53 if registered there, etc.) — replace the existing NS
  records (currently pointing at Route53) with the 4 Azure ones.
- [ ] **Wait for NS propagation** (`dig +short NS techseeding.com.au`
  should return only Azure NSes; usually 5–30 min, up to 24 h).
- [ ] **Sanity check:** `dig +short kidplayai.techseeding.com.au` from a
  fresh resolver should resolve via the new Azure DNS (no records yet at
  this point — that's fine; we just need the zone to be authoritative).

## 2. After Phase A — ACS Email domain verification

Required before kpai or ytai can send sign-in OTP emails.

- [ ] **Trigger the ACS Email custom-domain attach** — the Bicep creates
  the Email Communications Services resource and starts a custom-domain
  registration for `techseeding.com.au`. Open the resource in the portal
  (or `az communication email domain show`) and copy the 3 verification
  records (DKIM CNAME pair + DMARC TXT + sender-auth TXT).
- [ ] **Add those records to the Azure DNS zone.** Either via portal or
  `az network dns record-set {cname,txt} add-record ...`. (We can script
  this part once the values are known.)
- [ ] **Wait for ACS to mark the domain `Verified`.** Usually < 15 min
  once records propagate.
- [ ] **Verify a test send** with `az communication email send` against a
  noreply@techseeding.com.au sender to your own inbox.

## 3. Before Phase B — secret values

The Bicep creates empty secret slots in Key Vault. You provide values.

- [ ] **Create a local `.env.azure-secrets`** (gitignored — never commit):
  ```
  KPAI_JWT_SECRET=<generate: openssl rand -hex 32>
  KPAI_SANDBOX_DEEPSEEK_API_KEY=<from DeepSeek console>
  KPAI_ADMIN_PASSWORD=<pick one>

  YTAI_JWT_SECRET=<generate: openssl rand -hex 32>
  YTAI_OPENROUTER_API_KEY=<from OpenRouter console>
  YTAI_ADMIN_PASSWORD=<pick one>

  # Postgres admin password (Bicep can also auto-generate this — pick one path)
  PG_ADMIN_PASSWORD=<generate: openssl rand -hex 24>
  ```
- [ ] **Run `seed-secrets.sh`** — reads the file and `az keyvault secret set`s
  every entry. Idempotent; rerun whenever you rotate.
- [ ] **Delete or move the .env.azure-secrets file** somewhere safe
  (password manager) after a successful seed. It shouldn't live in the
  repo working tree.

## 4. Google OAuth (only if you add staging URLs)

If both `kidplayai.techseeding.com.au` and
`yoututorai.techseeding.com.au` keep their current domains after cutover,
**no Google Cloud changes are needed.** The approved redirect URIs already
include them.

- [ ] *(only if needed)* Add staging hosts to each OAuth client's
  "Authorized redirect URIs" in Google Cloud Console:
  - kpai client → add `https://kpai.<env>.azurecontainerapps.io/api/auth/google`
  - ytai client → add `https://ytai.<env>.azurecontainerapps.io/api/auth/google`
- [ ] *(only if needed)* Remove the staging URIs after cutover.

## 5. Cutover — your call

- [ ] **Confirm Azure side is healthy** on staging URLs
  (`*.azurecontainerapps.io`) for both apps. Test OTP login + Google
  login + a tutor session for ytai + a sandbox session for kpai.
- [ ] **Trigger the DNS flip** — point `kidplayai.techseeding.com.au` and
  `yoututorai.techseeding.com.au` A records at the ACA ingress IPs (the
  release script can do this part for you on signal).
- [ ] **Watch logs in Azure Monitor** for the next 30 min as traffic
  shifts. Old AWS ALB will receive less traffic as resolvers update.
- [ ] **Verify ACS Email delivery in prod** by signing up with a fresh
  email — make sure the OTP lands.

## 6. AWS teardown — done

Completed 2026-06-12. Both CDK stacks (`ytai-prod`, `kpai-prod`),
the txd S3 bucket + CloudFront distribution, ECR repos (kpai, ytai),
the SES `techseeding.com.au` domain identity, the Route53 hosted zone,
and all repo-side AWS code (`packages/deploy/`, `apps/{kpai,ytai}/deploy/`,
root release/diff/synth scripts) are gone.

**Manual leftovers** the prod IAM user couldn't reach — clean up with a
higher-privileged role when convenient (all of them are $0 to leave):

- EFS `SandboxFs` (ap-southeast-2) — retained from kpai's `RemovalPolicy.RETAIN`.
- Aurora final snapshot — auto-created by kpai's `RemovalPolicy.SNAPSHOT`
  during stack destroy; verify and delete in RDS console.
- us-east-1 ACM cert for `*.techseeding.com.au` — was used by txd's
  CloudFront distribution; ACM certs are free, can stay.
- `techseeding2020@gmail.com` SES email identity — pre-verified sender,
  unclear if still needed elsewhere; leave unless you're sure.

**Cost-only leftover** — the `techseeding.com.au` registration in
Route53 Domains. AWS will auto-renew at ~$13/year. To stop the bill,
either transfer the domain out (Cloudflare/Namecheap/etc.) or let it
lapse. Until then the AWS account needs a valid payment method.

## Appendix: dropping VNet integration (cost-saver redeploy)

Postgres network mode and ACA Environment VNet config are both **immutable** —
switching from VNet-integrated to public-endpoint requires destroying and
recreating those two resources. The rest of the RG (KV, Storage, ACR, DNS,
ACS, UAMI, Log Analytics) survives untouched, so secrets and DNS authority
stay intact.

Run from a healthy state (no in-flight deploys):

```bash
RG=techseeding-rg

# 1. Delete the Container Apps + Jobs (apps.bicep resources).
az containerapp delete -g $RG -n kpai --yes
az containerapp delete -g $RG -n ytai --yes
az containerapp job delete -g $RG -n kpai-migrate --yes
az containerapp job delete -g $RG -n ytai-migrate --yes

# 2. Delete the ACA Environment (frees the managed LB + Public IP).
az containerapp env delete -g $RG -n techseeding-env --yes

# 3. Delete the Postgres server (DATA LOSS — pg_dump first if needed).
az postgres flexible-server delete -g $RG -n techseeding-pg --yes

# 4. Delete the now-orphan VNet + private DNS zone link.
az network vnet subnet delete -g $RG --vnet-name techseeding-vnet -n aca || true
az network vnet subnet delete -g $RG --vnet-name techseeding-vnet -n db || true
az network vnet delete -g $RG -n techseeding-vnet
az network private-dns link vnet delete -g $RG \
  -z privatelink.postgres.database.azure.com -n techseeding-vnet-pg-link --yes || true
az network private-dns zone delete -g $RG \
  -n privatelink.postgres.database.azure.com --yes || true

# 5. Redeploy infra (Postgres + ACA env recreate without VNet).
pnpm azure:deploy:infra

# 6. Redeploy apps (Container Apps + Jobs rebind to the new env).
pnpm azure:deploy:apps
```

KV secrets, ACR images, Storage blobs, DNS zone records, and ACS Email
domain verification all survive — no re-seeding needed.

## Notes

- The DNS authority change (step 1) is the single most-fragile moment.
  Until NS records point at Azure, ACA managed certs can't issue, ACS
  Email can't verify, and the migration is stuck. Do this first and
  give it time to propagate.
- Phase A can run any time — it doesn't touch DNS authority, so you can
  validate Azure resources come up clean on the staging FQDNs before
  committing to the registrar change.
- Keep the AWS side running and healthy through Phases A and B. Cutover
  in step 5 is the only moment where prod traffic shifts.
