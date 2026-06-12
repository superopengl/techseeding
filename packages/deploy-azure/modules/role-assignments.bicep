// RBAC role assignments wiring Container Apps' system-assigned identities
// to the resources they consume.
//
// Role definition IDs:
//   AcrPull                              — 7f951dda-4ed3-4680-a7ca-43fe172d538d
//   Key Vault Secrets User               — 4633458b-17de-457d-b4b3-3cf99a9d70e1
//   Storage Blob Data Contributor        — ba92f5b4-2d11-453d-a403-e96b0029c9fe
//   Storage File Data SMB Share Contributor — 0c867c2a-1d8c-454a-a3db-ab2ea1bdc8bb

@description('ACR resource ID.')
param acrId string

@description('Key Vault resource ID.')
param keyVaultId string

@description('Storage account resource ID.')
param storageAccountId string

@description('Principal IDs that need full access to the wired resources. Array of {appName, principalId, needsBlob, needsFile}.')
param principals array

var roleIds = {
  acrPull:        '7f951dda-4ed3-4680-a7ca-43fe172d538d'
  kvSecretsUser:  '4633458b-17de-457d-b4b3-3cf99a9d70e1'
  blobContrib:    'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
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

// ACR pull for every container-bearing principal.
resource acrPullAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for p in principals: {
  scope: acr
  name: guid(acrId, p.principalId, roleIds.acrPull)
  properties: {
    principalId: p.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleIds.acrPull)
    principalType: 'ServicePrincipal'
  }
}]

// KV Secrets User for every principal (apps + jobs read their secrets).
resource kvSecretsUserAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for p in principals: {
  scope: kv
  name: guid(keyVaultId, p.principalId, roleIds.kvSecretsUser)
  properties: {
    principalId: p.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleIds.kvSecretsUser)
    principalType: 'ServicePrincipal'
  }
}]

// Blob contributor — only for principals that need to read/write blobs.
resource blobAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (p, i) in principals: if (contains(p, 'needsBlob') && p.needsBlob) {
  scope: sa
  name: guid(storageAccountId, p.principalId, roleIds.blobContrib)
  properties: {
    principalId: p.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleIds.blobContrib)
    principalType: 'ServicePrincipal'
  }
}]
