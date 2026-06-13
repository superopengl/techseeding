// Storage Account hosting:
//   - ytai-images blob container (worksheet photos)
//   - txd-static blob container (static site assets — replaces s3://txd-portal/)
//   - kpai-sandboxes file share (replaces EFS at /var/kpai)
//
// Lifecycle management policy deletes blobs tagged `lifecycle=orphan`
// (set via blob index tags) after 1 day — direct equivalent of the old S3
// tag-driven lifecycle.

@description('Azure region.')
param location string

@description('Tags applied to all resources.')
param tags object = {}

@description('Storage account name (must be globally unique, 3-24 lowercase alphanumeric).')
param name string

resource sa 'Microsoft.Storage/storageAccounts@2024-01-01' = {
  name: name
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2024-01-01' = {
  parent: sa
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 7 }
    containerDeleteRetentionPolicy: { enabled: true, days: 7 }
  }
}

resource ytaiImages 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  parent: blobService
  name: 'ytai-images'
  properties: { publicAccess: 'None' }
}

resource txdStatic 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  parent: blobService
  name: 'txd-static'
  properties: { publicAccess: 'None' }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2024-01-01' = {
  parent: sa
  name: 'default'
}

resource kpaiSandboxes 'Microsoft.Storage/storageAccounts/fileServices/shares@2024-01-01' = {
  parent: fileService
  name: 'kpai-sandboxes'
  properties: {
    shareQuota: 100
    enabledProtocols: 'SMB'
    accessTier: 'TransactionOptimized'
  }
}

// Lifecycle: delete orphan blobs after 1 day.
// markObjectOrphan() in ytai sets blob index tag `lifecycle=orphan`.
resource lifecycle 'Microsoft.Storage/storageAccounts/managementPolicies@2024-01-01' = {
  parent: sa
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          enabled: true
          name: 'expire-orphan-blobs'
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: ['blockBlob']
              blobIndexMatch: [
                { name: 'lifecycle', op: '==', value: 'orphan' }
              ]
            }
            actions: {
              baseBlob: {
                delete: { daysAfterModificationGreaterThan: 1 }
              }
            }
          }
        }
      ]
    }
  }
}

output id string = sa.id
output name string = sa.name
output blobEndpoint string = sa.properties.primaryEndpoints.blob
output fileEndpoint string = sa.properties.primaryEndpoints.file
output ytaiImagesContainer string = ytaiImages.name
output txdStaticContainer string = txdStatic.name
output kpaiSandboxesShare string = kpaiSandboxes.name
