// User-Assigned Managed Identity that Container Apps + Jobs use to:
//   - pull images from ACR (role: AcrPull)
//   - read KV secrets via Container Apps secret refs (role: Key Vault Secrets User)
//   - read/write blobs (role: Storage Blob Data Contributor)
//
// Why a UAMI and not system-assigned MI per app: the system-assigned MI's
// principalId only exists after the Container App provisions, but the app
// can't provision its first revision without already having AcrPull. UAMI
// breaks that cycle — created up front, RBAC granted, then attached to
// every app + job.

@description('Azure region.')
param location string

@description('Tags applied to the identity.')
param tags object = {}

@description('Identity name.')
param name string

@description('ACR resource ID to grant AcrPull on.')
param acrId string

@description('Key Vault resource ID to grant Secrets User on.')
param keyVaultId string

@description('Storage account resource ID to grant Blob Data Contributor on.')
param storageAccountId string

var roleIds = {
  acrPull:        '7f951dda-4ed3-4680-a7ca-43fe172d538d'
  kvSecretsUser:  '4633458b-17de-408a-b874-0445c86b69e6'
  blobContrib:    'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
}

resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: name
  location: location
  tags: tags
}

resource acr 'Microsoft.ContainerRegistry/registries@2025-04-01' existing = {
  name: last(split(acrId, '/'))
}
resource kv 'Microsoft.KeyVault/vaults@2024-12-01-preview' existing = {
  name: last(split(keyVaultId, '/'))
}
resource sa 'Microsoft.Storage/storageAccounts@2024-01-01' existing = {
  name: last(split(storageAccountId, '/'))
}

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: acr
  name: guid(acrId, uami.id, roleIds.acrPull)
  properties: {
    principalId: uami.properties.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleIds.acrPull)
    principalType: 'ServicePrincipal'
  }
}

resource kvSecretsUserAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: kv
  name: guid(keyVaultId, uami.id, roleIds.kvSecretsUser)
  properties: {
    principalId: uami.properties.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleIds.kvSecretsUser)
    principalType: 'ServicePrincipal'
  }
}

resource blobAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: sa
  name: guid(storageAccountId, uami.id, roleIds.blobContrib)
  properties: {
    principalId: uami.properties.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleIds.blobContrib)
    principalType: 'ServicePrincipal'
  }
}

output id string = uami.id
output principalId string = uami.properties.principalId
output clientId string = uami.properties.clientId
output name string = uami.name
