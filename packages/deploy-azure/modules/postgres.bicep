// PostgreSQL Flexible Server with two databases (kpai, ytai), VNet-integrated
// so it's only reachable from the ACA subnet. Burstable B1ms — cheapest tier
// that runs prod; bump to B2s if pgvector or heavier workloads land.

@description('Azure region.')
param location string

@description('Tags applied to all resources.')
param tags object = {}

@description('Server name (must be globally unique, lowercase).')
param name string

@description('Admin username.')
param adminUsername string = 'pgadmin'

@description('Admin password.')
@secure()
param adminPassword string

@description('Delegated subnet ID for the server.')
param delegatedSubnetId string

@description('Private DNS zone ID for postgres.database.azure.com.')
param privateDnsZoneId string

@description('SKU name. B1ms (1 vCPU, 2 GB) is the smallest Burstable tier.')
param skuName string = 'Standard_B1ms'

@description('Storage size (GB). Minimum 32.')
param storageGB int = 32

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2025-01-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: adminUsername
    administratorLoginPassword: adminPassword
    storage: { storageSizeGB: storageGB }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: delegatedSubnetId
      privateDnsZoneArmResourceId: privateDnsZoneId
    }
    highAvailability: { mode: 'Disabled' }
  }
}

resource kpaiDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2025-01-01-preview' = {
  parent: pg
  name: 'kpai'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

resource ytaiDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2025-01-01-preview' = {
  parent: pg
  name: 'ytai'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

output fqdn string = pg.properties.fullyQualifiedDomainName
output serverName string = pg.name
output adminUsername string = adminUsername
