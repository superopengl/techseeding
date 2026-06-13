// Azure Container Registry. Basic SKU is enough for two small repos.
// Admin user disabled — Container Apps pulls via system-assigned managed
// identity + AcrPull RBAC (wired in role-assignments.bicep).

@description('Azure region.')
param location string

@description('Tags applied to all resources.')
param tags object = {}

@description('Registry name (must be globally unique, lowercase, alphanumeric).')
param name string

resource acr 'Microsoft.ContainerRegistry/registries@2025-04-01' = {
  name: name
  location: location
  tags: tags
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    anonymousPullEnabled: false
  }
}

output id string = acr.id
output loginServer string = acr.properties.loginServer
output name string = acr.name
