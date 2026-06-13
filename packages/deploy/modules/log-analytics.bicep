// Log Analytics workspace consumed by Container Apps Environment and any
// diagnostic settings we add later.

@description('Azure region.')
param location string

@description('Tags applied to all resources.')
param tags object = {}

@description('Workspace name.')
param name string

resource logs 'Microsoft.OperationalInsights/workspaces@2025-02-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    workspaceCapping: { dailyQuotaGb: 5 }
  }
}

output id string = logs.id
output customerId string = logs.properties.customerId
#disable-next-line outputs-should-not-contain-secrets
output sharedKey string = logs.listKeys().primarySharedKey
