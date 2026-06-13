// PostgreSQL Flexible Server with two databases (kpai, ytai), reachable via
// public endpoint with firewall locked to Azure-internal callers only. Apps in
// the same region's ACA Consumption pool connect through Azure's backbone, not
// the public internet, so latency stays low and we don't pay for VNet
// integration or the private DNS zone.
//
// Burstable B1ms — cheapest tier that runs prod; bump to B2s if pgvector or
// heavier workloads land.

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

@description('SKU name. B1ms (1 vCPU, 2 GB) is the smallest Burstable tier.')
param skuName string = 'Standard_B1ms'

@description('Storage size (GB). Minimum 32.')
param storageGB int = 32

@description('Extra firewall rules (e.g. operator laptop IPs for psql access).')
param extraFirewallRules array = []

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
      publicNetworkAccess: 'Enabled'
    }
    highAvailability: { mode: 'Disabled' }
  }
}

// Azure-convention firewall rule: start=end=0.0.0.0 means "Allow all Azure
// services". Only callers with the admin password (stored in KV) can connect;
// the ACA env's outbound IPs are not stable enough to lock per-IP on
// Consumption profile.
resource fwAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2025-01-01-preview' = {
  parent: pg
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource fwExtra 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2025-01-01-preview' = [for (rule, i) in extraFirewallRules: {
  parent: pg
  name: rule.name
  properties: {
    startIpAddress: rule.startIp
    endIpAddress: rule.endIp
  }
}]

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
