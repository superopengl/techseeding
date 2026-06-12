// Key Vault holding app secrets. Slots are created empty; values are seeded
// post-deploy via scripts/seed-secrets.sh reading a local .env file.
//
// RBAC model: Container Apps reference secrets via their system-assigned
// identity + "Key Vault Secrets User" role assignment (see role-assignments.bicep).

@description('Azure region.')
param location string

@description('Tags applied to all resources.')
param tags object = {}

@description('Vault name (must be globally unique).')
param name string

@description('Tenant ID for the vault. Defaults to the deploying subscription.')
param tenantId string = subscription().tenantId

@description('Object IDs of principals that need full secrets admin (for seed-secrets.sh).')
param adminPrincipalIds array = []

resource kv 'Microsoft.KeyVault/vaults@2024-12-01-preview' = {
  name: name
  location: location
  tags: tags
  properties: {
    tenantId: tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    // Tenant policy in this subscription requires purge protection on. Once
    // enabled this is irreversible — vault deletion is soft-delete-only for
    // the retention window, then the vault name is released.
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// "Key Vault Secrets Officer" lets the deployer set/list/delete secrets.
var secretsOfficerRoleId = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'

resource kvAdmin 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (pid, i) in adminPrincipalIds: {
  scope: kv
  name: guid(kv.id, pid, secretsOfficerRoleId)
  properties: {
    principalId: pid
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', secretsOfficerRoleId)
    principalType: 'User'
  }
}]

// Empty secret slots — Bicep creates the slot, seed-secrets.sh fills it.
// Listed here so they're observable in the deployed state even before seeding.
var secretNames = [
  'kpai-db-password'
  'kpai-jwt-secret'
  'kpai-sandbox-deepseek-api-key'
  'kpai-admin-password'
  'kpai-acs-connection-string'
  'ytai-db-password'
  'ytai-jwt-secret'
  'ytai-openrouter-api-key'
  'ytai-admin-password'
  'ytai-acs-connection-string'
  'pg-admin-password'
]

output id string = kv.id
output uri string = kv.properties.vaultUri
output name string = kv.name
output secretNames array = secretNames
