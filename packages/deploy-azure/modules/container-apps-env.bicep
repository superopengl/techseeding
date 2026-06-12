// Container Apps Environment — the shared hosting plane both apps run in.
// Non-VNet Consumption workload profile: cheapest tier, no managed Load
// Balancer + Public IP in the infra-managed RG, and the lowest per-vCPU-second
// rate. Outbound to Postgres goes over Azure backbone via public endpoint.

@description('Azure region.')
param location string

@description('Tags applied to all resources.')
param tags object = {}

@description('Environment name.')
param name string

@description('Log Analytics workspace ID.')
param logAnalyticsCustomerId string

@description('Log Analytics workspace shared key.')
@secure()
param logAnalyticsSharedKey string

@description('Storage account name to mount as an Azure Files volume (for kpai sandboxes).')
param storageAccountName string

@description('Storage account access key.')
@secure()
param storageAccountKey string

@description('File share name to expose as a volume.')
param fileShareName string

@description('Logical volume name exposed to Container Apps via volumes[].')
param storageVolumeName string = 'kpai-sandboxes-mount'

resource env 'Microsoft.App/managedEnvironments@2025-02-02-preview' = {
  name: name
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// Expose the file share as a managed environment storage. Container Apps
// reference this by name in their volumeMounts.
resource sharedStorage 'Microsoft.App/managedEnvironments/storages@2025-02-02-preview' = {
  parent: env
  name: storageVolumeName
  properties: {
    azureFile: {
      accountName: storageAccountName
      accountKey: storageAccountKey
      shareName: fileShareName
      accessMode: 'ReadWrite'
    }
  }
}

output id string = env.id
output defaultDomain string = env.properties.defaultDomain
output staticIp string = env.properties.staticIp
output storageVolumeName string = sharedStorage.name
