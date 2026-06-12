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

## 6. AWS teardown — after Azure is stable

Run only after Azure has been serving prod traffic for at least a few
days without incident.

- [ ] `pnpm -F @techseeding/deploy diff:kpai` — sanity check what's
  about to disappear.
- [ ] `pnpm -F @techseeding/deploy destroy:kpai` (will tear down the
  whole shared core: VPC, ALB, Aurora, EFS).
- [ ] `pnpm -F @techseeding/deploy destroy:ytai` (no-op if already
  removed by kpai destroy's cascade — ytai stack just references
  kpai resources).
- [ ] **Manually delete txd's old infra:**
  - `aws s3 rm s3://txd-portal --recursive && aws s3 rb s3://txd-portal`
  - `aws cloudfront delete-distribution --id E1JLIDSYCZB9UH`
    (disable first, wait for `Deployed` state, then delete)
- [ ] **Delete ECR repos** (kpai, ytai) once you're sure no rollback is
  needed: `aws ecr delete-repository --repository-name <name> --force`.
- [ ] **Remove SES identity** for `techseeding.com.au` in AWS console.
- [ ] **Delete Route53 hosted zone** for `techseeding.com.au` (only after
  NS records have been pointing at Azure for several days and you've
  confirmed no Route53-only consumers remain).
- [ ] **Remove `apps/{kpai,ytai}/deploy/` and the AWS-side root scripts**
  from the repo (`release:kpai`, `release:ytai`, `diff:kpai`, etc.).
- [ ] **Cancel the AWS account** or scale it down to $0 if no other
  workloads run on it.

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
