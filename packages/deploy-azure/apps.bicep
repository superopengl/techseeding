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

@description('ACR resource ID.')
param acrId string

@description('Key Vault resource ID.')
param keyVaultId string

@description('Key Vault URI (https://name.vault.azure.net/).')
param keyVaultUri string

@description('Storage account resource ID.')
param storageAccountId string

@description('Storage account blob endpoint (https://name.blob.core.windows.net/).')
param storageBlobEndpoint string

@description('Postgres FQDN.')
param postgresFqdn string

@description('ACS sender address (e.g. donotreply@techseeding.com.au or the AzureManagedDomain).')
param acsSender string

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

// ─── Common derived values ──────────────────────────────────────────────────

var kpaiImage = '${acrLoginServer}/kpai:${kpaiImageTag}'
var ytaiImage = '${acrLoginServer}/ytai:${ytaiImageTag}'

var kpaiPublicUrl = empty(kpaiCustomDomain) ? '' : 'https://${kpaiCustomDomain}'
var ytaiPublicUrl = empty(ytaiCustomDomain) ? '' : 'https://${ytaiCustomDomain}'

// kpai DB connection — built from server FQDN + KV-mounted password.
// The app reads KPAI_DATABASE_URL as a single string, but here we set
// individual components and let the runtime assemble them — except for
// the password which must be a secret ref.
var kpaiDbUser = 'kpai'
var ytaiDbUser = 'ytai'

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
    externalIngress: true
    targetPort: 80
    minReplicas: 1
    maxReplicas: 3
    customDomain: kpaiCustomDomain
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
      { name: 'KPAI_DB_HOST', value: postgresFqdn }
      { name: 'KPAI_DB_PORT', value: '5432' }
      { name: 'KPAI_DB_NAME', value: 'kpai' }
      { name: 'KPAI_DB_USER', value: kpaiDbUser }
      { name: 'KPAI_SANDBOX_DEEPSEEK_MODEL', value: kpaiDeepseekModel }
      { name: 'KPAI_GOOGLE_CLIENT_ID', value: kpaiGoogleClientId }
      { name: 'KPAI_ADMIN_USERNAME', value: 'admin' }
      { name: 'KPAI_ACS_SENDER', value: acsSender }
      { name: 'RUN_MIGRATIONS', value: 'true' }
      { name: 'TMPDIR', value: '/var/kpai' }
    ]
    envSecretRefs: [
      { name: 'KPAI_DB_PASSWORD', secretRef: 'db-password' }
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
    externalIngress: true
    targetPort: 80
    minReplicas: 0
    maxReplicas: 2
    customDomain: ytaiCustomDomain
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
      { name: 'YTAI_DB_HOST', value: postgresFqdn }
      { name: 'YTAI_DB_PORT', value: '5432' }
      { name: 'YTAI_DB_NAME', value: 'ytai' }
      { name: 'YTAI_DB_USER', value: ytaiDbUser }
      { name: 'YTAI_OPENROUTER_CHAT_MODEL', value: ytaiOpenrouterChatModel }
      { name: 'YTAI_OPENROUTER_BASE_URL', value: ytaiOpenrouterBaseUrl }
      { name: 'YTAI_GOOGLE_CLIENT_ID', value: ytaiGoogleClientId }
      { name: 'YTAI_ADMIN_USERNAME', value: 'admin' }
      { name: 'YTAI_ACS_SENDER', value: acsSender }
      { name: 'YTAI_STORAGE_ACCOUNT_URL', value: storageBlobEndpoint }
      { name: 'YTAI_BLOB_CONTAINER', value: 'ytai-images' }
      { name: 'YTAI_BLOB_PREFIX', value: 'prod' }
      { name: 'YTAI_TTS_BASE_URL', value: 'http://127.0.0.1:8880/v1' }
      { name: 'YTAI_TTS_MODEL', value: 'kokoro' }
      { name: 'YTAI_TTS_VOICE', value: 'af_heart' }
    ]
    envSecretRefs: [
      { name: 'YTAI_DB_PASSWORD', secretRef: 'db-password' }
      { name: 'YTAI_JWT_SECRET', secretRef: 'jwt-secret' }
      { name: 'YTAI_OPENROUTER_API_KEY', secretRef: 'openrouter-key' }
      { name: 'YTAI_ADMIN_PASSWORD', secretRef: 'admin-password' }
      { name: 'YTAI_ACS_CONNECTION_STRING', secretRef: 'acs-connection-string' }
    ]
    resources: { cpu: json('1.0'), memory: '4Gi' }
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
    command: ['npx', 'drizzle-kit', 'migrate', '--config', 'src/api/drizzle.config.js']
    secretRefs: [
      { appSecretName: 'db-password', keyVaultSecretUri: '${keyVaultUri}secrets/kpai-db-password' }
    ]
    envVars: [
      { name: 'KPAI_DB_HOST', value: postgresFqdn }
      { name: 'KPAI_DB_PORT', value: '5432' }
      { name: 'KPAI_DB_NAME', value: 'kpai' }
      { name: 'KPAI_DB_USER', value: kpaiDbUser }
      { name: 'RUN_MIGRATIONS', value: 'false' }
    ]
    envSecretRefs: [
      { name: 'KPAI_DB_PASSWORD', secretRef: 'db-password' }
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
    command: ['node', 'dist/src/api/db/migrate.js']
    secretRefs: [
      { appSecretName: 'db-password', keyVaultSecretUri: '${keyVaultUri}secrets/ytai-db-password' }
    ]
    envVars: [
      { name: 'YTAI_DB_HOST', value: postgresFqdn }
      { name: 'YTAI_DB_PORT', value: '5432' }
      { name: 'YTAI_DB_NAME', value: 'ytai' }
      { name: 'YTAI_DB_USER', value: ytaiDbUser }
    ]
    envSecretRefs: [
      { name: 'YTAI_DB_PASSWORD', secretRef: 'db-password' }
    ]
  }
}

// ─── Role Assignments ───────────────────────────────────────────────────────

module rbac 'modules/role-assignments.bicep' = {
  name: 'rbac'
  params: {
    acrId: acrId
    keyVaultId: keyVaultId
    storageAccountId: storageAccountId
    principals: [
      { appName: 'kpai',         principalId: kpaiApp.outputs.principalId,     needsBlob: false }
      { appName: 'ytai',         principalId: ytaiApp.outputs.principalId,     needsBlob: true  }
      { appName: 'kpai-migrate', principalId: kpaiMigrate.outputs.principalId, needsBlob: false }
      { appName: 'ytai-migrate', principalId: ytaiMigrate.outputs.principalId, needsBlob: false }
    ]
  }
}

output kpaiFqdn string = kpaiApp.outputs.fqdn
output ytaiFqdn string = ytaiApp.outputs.fqdn
output kpaiMigrateJobName string = kpaiMigrate.outputs.name
output ytaiMigrateJobName string = ytaiMigrate.outputs.name
