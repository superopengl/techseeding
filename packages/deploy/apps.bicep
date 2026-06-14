// Second-pass deployment: defines kpai + ytai Container Apps + their
// migration Jobs + role assignments. Run AFTER main.bicep and AFTER you've
// pushed container images to ACR — Bicep needs the image references at
// deploy time.
//
// Run via:
//   az deployment group create \
//     --resource-group techseeding-rg \
//     --template-file apps.bicep \
//     --parameters \
//       acrLoginServer=techseedingacr.azurecr.io \
//       kpaiImageTag=<tag> \
//       ytaiImageTag=<tag> \
//       containerAppsEnvId=<id> \
//       ...
//
// Or use scripts/deploy-apps.sh which gathers these from main.bicep's outputs.

targetScope = 'resourceGroup'

@description('Azure region.')
param location string = resourceGroup().location

@description('Tags applied to all resources.')
param tags object = {
  project: 'techseeding'
  managedBy: 'bicep'
}

@description('Managed Environment ID from main.bicep output.')
param containerAppsEnvId string

@description('ACR login server (e.g. techseedingacr.azurecr.io).')
param acrLoginServer string

@description('User-Assigned Managed Identity resource ID. From main.bicep output `uamiId`.')
param uamiId string

@description('Key Vault URI (https://name.vault.azure.net/).')
param keyVaultUri string

@description('Storage account blob endpoint (https://name.blob.core.windows.net/).')
param storageBlobEndpoint string

@description('Postgres FQDN.')
param postgresFqdn string

@description('kpai ACS sender address. The local-part must match a sender username on the verified domain (see acs-email module). Display name comes from that sender-username resource — e.g. `kidplayai@techseeding.com.au` renders as `KidPlayAI <kidplayai@…>` in inboxes.')
param kpaiAcsSender string = 'kidplayai@techseeding.com.au'

@description('ytai ACS sender address. Same constraint as kpaiAcsSender.')
param ytaiAcsSender string = 'yoututorai@techseeding.com.au'

@description('kpai container image tag.')
param kpaiImageTag string = 'latest'

@description('ytai container image tag.')
param ytaiImageTag string = 'latest'

@description('kpai custom domain (e.g. kidplayai.techseeding.com.au). Empty = no custom domain.')
param kpaiCustomDomain string = ''

@description('ytai custom domain (e.g. yoututorai.techseeding.com.au). Empty = no custom domain.')
param ytaiCustomDomain string = ''

@description('kpai Google OAuth client ID. Empty disables Google SSO.')
param kpaiGoogleClientId string = ''

@description('ytai Google OAuth client ID. Empty disables Google SSO.')
param ytaiGoogleClientId string = ''

@description('kpai DeepSeek model id.')
param kpaiDeepseekModel string = 'deepseek-chat'

@description('ytai OpenRouter chat model id.')
param ytaiOpenrouterChatModel string = 'google/gemini-2.5-pro'

@description('ytai OpenRouter base URL.')
param ytaiOpenrouterBaseUrl string = 'https://openrouter.ai/api/v1'

@description('Managed certificate resource ID for kpai\'s custom domain. Empty → bindingType "Disabled" (which destroys any existing cert binding on redeploy). deploy-apps.sh auto-discovers this from the ACA env.')
param kpaiManagedCertificateId string = ''

@description('Managed certificate resource ID for ytai\'s custom domain. Same constraint as kpaiManagedCertificateId.')
param ytaiManagedCertificateId string = ''

// ─── Common derived values ──────────────────────────────────────────────────

var kpaiImage = '${acrLoginServer}/kpai:${kpaiImageTag}'
var ytaiImage = '${acrLoginServer}/ytai:${ytaiImageTag}'

var kpaiPublicUrl = empty(kpaiCustomDomain) ? '' : 'https://${kpaiCustomDomain}'
var ytaiPublicUrl = empty(ytaiCustomDomain) ? '' : 'https://${ytaiCustomDomain}'

// Look up the UAMI by ID so we can pass its clientId into the app env as
// AZURE_CLIENT_ID. @azure/identity's DefaultAzureCredential needs this to
// pick the right managed identity on a Container App that has UAMI only
// (no system-assigned identity) — otherwise its ManagedIdentityCredential
// step queries IMDS without a client_id and the chain falls through to
// "ChainedTokenCredential authentication failed".
resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: last(split(uamiId, '/'))
}

// Postgres login per app. Default 'pgadmin' shares the Flexible Server
// admin login for the smoke-test bring-up — flip these to per-app logins
// once a CREATE USER bootstrap runs (needs VNet-reachable psql or a one-off
// ACA Job). All three KV secrets (kpai-db-password / ytai-db-password /
// pg-admin-password) currently hold the same value.
@description('Postgres login for kpai. Defaults to the server admin login until per-app users are bootstrapped.')
param kpaiDbUser string = 'pgadmin'

@description('Postgres login for ytai. Defaults to the server admin login until per-app users are bootstrapped.')
param ytaiDbUser string = 'pgadmin'

// ─── kpai Container App ─────────────────────────────────────────────────────

module kpaiApp 'modules/container-app.bicep' = {
  name: 'kpai-app'
  params: {
    location: location
    tags: tags
    name: 'kpai'
    environmentId: containerAppsEnvId
    image: kpaiImage
    acrLoginServer: acrLoginServer
    uamiId: uamiId
    externalIngress: true
    targetPort: 80
    // min=0 → scales to zero when idle (first request pays cold-start).
    // Saves the ~$33/mo of an always-on replica for an early-stage app.
    // max=2 lets ACA run the new revision alongside the old during a release
    // so traffic doesn't drop while the new one starts up.
    minReplicas: 0
    maxReplicas: 2
    customDomain: kpaiCustomDomain
    managedCertificateId: kpaiManagedCertificateId
    secretRefs: [
      { appSecretName: 'db-password', keyVaultSecretUri: '${keyVaultUri}secrets/kpai-db-password' }
      { appSecretName: 'jwt-secret', keyVaultSecretUri: '${keyVaultUri}secrets/kpai-jwt-secret' }
      { appSecretName: 'deepseek-key', keyVaultSecretUri: '${keyVaultUri}secrets/kpai-sandbox-deepseek-api-key' }
      { appSecretName: 'admin-password', keyVaultSecretUri: '${keyVaultUri}secrets/kpai-admin-password' }
      { appSecretName: 'acs-connection-string', keyVaultSecretUri: '${keyVaultUri}secrets/kpai-acs-connection-string' }
    ]
    envVars: [
      { name: 'KPAI_API_PORT', value: '80' }
      { name: 'KPAI_PUBLIC_URL', value: kpaiPublicUrl }
      // entrypoint.sh composes KPAI_DATABASE_URL from these KPAI_PG_* vars
      // — KPAI_PG_PASSWORD comes via secretRef from Key Vault so the URL is
      // never assembled in Bicep (where secrets become plain strings).
      { name: 'KPAI_PG_HOST', value: postgresFqdn }
      { name: 'KPAI_PG_PORT', value: '5432' }
      { name: 'KPAI_PG_DATABASE', value: 'kpai' }
      { name: 'KPAI_PG_USER', value: kpaiDbUser }
      { name: 'KPAI_SANDBOX_DEEPSEEK_MODEL', value: kpaiDeepseekModel }
      { name: 'KPAI_GOOGLE_CLIENT_ID', value: kpaiGoogleClientId }
      { name: 'KPAI_ADMIN_USERNAME', value: 'admin' }
      { name: 'KPAI_ACS_SENDER', value: kpaiAcsSender }
      { name: 'RUN_MIGRATIONS', value: 'true' }
      { name: 'TMPDIR', value: '/var/kpai' }
    ]
    envSecretRefs: [
      { name: 'KPAI_PG_PASSWORD', secretRef: 'db-password' }
      { name: 'KPAI_JWT_SECRET', secretRef: 'jwt-secret' }
      { name: 'KPAI_SANDBOX_DEEPSEEK_API_KEY', secretRef: 'deepseek-key' }
      { name: 'KPAI_ADMIN_PASSWORD', secretRef: 'admin-password' }
      { name: 'KPAI_ACS_CONNECTION_STRING', secretRef: 'acs-connection-string' }
    ]
    volumeMounts: [
      { volumeName: 'kpai-sandboxes', mountPath: '/var/kpai' }
    ]
    volumes: [
      { name: 'kpai-sandboxes', storageName: 'kpai-sandboxes-mount' }
    ]
    resources: { cpu: json('0.5'), memory: '1Gi' }
  }
}

// ─── ytai Container App ─────────────────────────────────────────────────────

module ytaiApp 'modules/container-app.bicep' = {
  name: 'ytai-app'
  params: {
    location: location
    tags: tags
    name: 'ytai'
    environmentId: containerAppsEnvId
    image: ytaiImage
    acrLoginServer: acrLoginServer
    uamiId: uamiId
    externalIngress: true
    targetPort: 80
    minReplicas: 0
    maxReplicas: 2
    customDomain: ytaiCustomDomain
    managedCertificateId: ytaiManagedCertificateId
    secretRefs: [
      { appSecretName: 'db-password', keyVaultSecretUri: '${keyVaultUri}secrets/ytai-db-password' }
      { appSecretName: 'jwt-secret', keyVaultSecretUri: '${keyVaultUri}secrets/ytai-jwt-secret' }
      { appSecretName: 'openrouter-key', keyVaultSecretUri: '${keyVaultUri}secrets/ytai-openrouter-api-key' }
      { appSecretName: 'admin-password', keyVaultSecretUri: '${keyVaultUri}secrets/ytai-admin-password' }
      { appSecretName: 'acs-connection-string', keyVaultSecretUri: '${keyVaultUri}secrets/ytai-acs-connection-string' }
    ]
    envVars: [
      { name: 'YTAI_API_PORT', value: '80' }
      { name: 'YTAI_PUBLIC_URL', value: ytaiPublicUrl }
      // entrypoint.sh composes YTAI_DATABASE_URL (with sslmode=require)
      // from these YTAI_PG_* vars.
      { name: 'YTAI_PG_HOST', value: postgresFqdn }
      { name: 'YTAI_PG_PORT', value: '5432' }
      { name: 'YTAI_PG_DATABASE', value: 'ytai' }
      { name: 'YTAI_PG_USER', value: ytaiDbUser }
      { name: 'YTAI_OPENROUTER_CHAT_MODEL', value: ytaiOpenrouterChatModel }
      { name: 'YTAI_OPENROUTER_BASE_URL', value: ytaiOpenrouterBaseUrl }
      { name: 'YTAI_GOOGLE_CLIENT_ID', value: ytaiGoogleClientId }
      { name: 'YTAI_ADMIN_USERNAME', value: 'admin' }
      { name: 'YTAI_ACS_SENDER', value: ytaiAcsSender }
      { name: 'YTAI_STORAGE_ACCOUNT_URL', value: storageBlobEndpoint }
      { name: 'YTAI_BLOB_CONTAINER', value: 'ytai-images' }
      { name: 'YTAI_BLOB_PREFIX', value: 'prod' }
      // Tells @azure/identity which user-assigned identity to use when no
      // system-assigned identity is attached. Required for blob.js to auth
      // against Azure Storage.
      { name: 'AZURE_CLIENT_ID', value: uami.properties.clientId }
      { name: 'YTAI_TTS_BASE_URL', value: 'http://127.0.0.1:8880/v1' }
      { name: 'YTAI_TTS_MODEL', value: 'kokoro' }
      { name: 'YTAI_TTS_VOICE', value: 'am_fenrir' }
    ]
    envSecretRefs: [
      { name: 'YTAI_PG_PASSWORD', secretRef: 'db-password' }
      { name: 'YTAI_JWT_SECRET', secretRef: 'jwt-secret' }
      { name: 'YTAI_OPENROUTER_API_KEY', secretRef: 'openrouter-key' }
      { name: 'YTAI_ADMIN_PASSWORD', secretRef: 'admin-password' }
      { name: 'YTAI_ACS_CONNECTION_STRING', secretRef: 'acs-connection-string' }
    ]
    // Consumption profile requires CPU:memory ratio of 1:2 — 1.0/4Gi is
    // rejected; 2.0/4Gi is the smallest valid pairing that fits Kokoro + Node.
    resources: { cpu: json('2.0'), memory: '4Gi' }
  }
}

// ─── Migration Jobs ─────────────────────────────────────────────────────────

module kpaiMigrate 'modules/container-app-job.bicep' = {
  name: 'kpai-migrate-job'
  params: {
    location: location
    tags: tags
    name: 'kpai-migrate'
    environmentId: containerAppsEnvId
    image: kpaiImage
    acrLoginServer: acrLoginServer
    uamiId: uamiId
    // Use the runtime migrator (drizzle-orm/postgres-js/migrator) baked into
    // the prod image — drizzle-kit is a devDep and not installed under
    // `pnpm install --prod`. Same script docker-entrypoint.sh runs when
    // RUN_MIGRATIONS=true; safe to invoke standalone.
    command:['node', 'src/api/migrate.js']
    secretRefs: [
      { appSecretName: 'db-password', keyVaultSecretUri: '${keyVaultUri}secrets/kpai-db-password' }
    ]
    envVars: [
      { name: 'KPAI_PG_HOST', value: postgresFqdn }
      { name: 'KPAI_PG_PORT', value: '5432' }
      { name: 'KPAI_PG_DATABASE', value: 'kpai' }
      { name: 'KPAI_PG_USER', value: kpaiDbUser }
      { name: 'RUN_MIGRATIONS', value: 'false' }
    ]
    envSecretRefs: [
      { name: 'KPAI_PG_PASSWORD', secretRef: 'db-password' }
    ]
  }
}

module ytaiMigrate 'modules/container-app-job.bicep' = {
  name: 'ytai-migrate-job'
  params: {
    location: location
    tags: tags
    name: 'ytai-migrate'
    environmentId: containerAppsEnvId
    image: ytaiImage
    acrLoginServer: acrLoginServer
    uamiId: uamiId
    // dist/src is copied to /opt/ytai/src in the Dockerfile (not /opt/ytai/dist/src),
    // so the migrate script lives at src/api/db/migrate.js relative to WORKDIR.
    command:['node', 'src/api/db/migrate.js']
    secretRefs: [
      { appSecretName: 'db-password', keyVaultSecretUri: '${keyVaultUri}secrets/ytai-db-password' }
    ]
    envVars: [
      { name: 'YTAI_PG_HOST', value: postgresFqdn }
      { name: 'YTAI_PG_PORT', value: '5432' }
      { name: 'YTAI_PG_DATABASE', value: 'ytai' }
      { name: 'YTAI_PG_USER', value: ytaiDbUser }
    ]
    envSecretRefs: [
      { name: 'YTAI_PG_PASSWORD', secretRef: 'db-password' }
    ]
  }
}

// ─── Role Assignments ──────────────────────────────────────────────────────
// RBAC moved into the UAMI itself (modules/managed-identity.bicep), invoked
// from main.bicep. Container Apps + Jobs all share the same UAMI so there's
// no per-app role assignment to wire here.

output kpaiFqdn string = kpaiApp.outputs.fqdn
output ytaiFqdn string = ytaiApp.outputs.fqdn
output kpaiMigrateJobName string = kpaiMigrate.outputs.name
output ytaiMigrateJobName string = ytaiMigrate.outputs.name
