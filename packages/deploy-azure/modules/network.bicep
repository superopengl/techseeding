// VNet + subnets shared by Container Apps, Postgres, and private endpoints.
// Address space is /16 with a /23 for ACA (ACA requires at least /23) and
// /28s for Postgres delegation and private endpoints.

@description('Azure region.')
param location string

@description('Tags applied to all resources.')
param tags object = {}

@description('Name prefix for all networking resources.')
param namePrefix string

var vnetName = '${namePrefix}-vnet'
var addressSpace = '10.20.0.0/16'

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: [addressSpace] }
    subnets: [
      {
        // Container Apps Environment infrastructure subnet — must be /23 or larger.
        name: 'aca'
        properties: {
          addressPrefix: '10.20.0.0/23'
          delegations: [
            {
              name: 'aca-delegation'
              properties: { serviceName: 'Microsoft.App/environments' }
            }
          ]
        }
      }
      {
        // Postgres Flexible Server delegated subnet — single /28 with the
        // dbforPostgresqlFlexibleServers delegation.
        name: 'db'
        properties: {
          addressPrefix: '10.20.2.0/28'
          delegations: [
            {
              name: 'pg-delegation'
              properties: { serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers' }
            }
          ]
          serviceEndpoints: [
            { service: 'Microsoft.Storage' }
          ]
        }
      }
      {
        // Private endpoints for Key Vault and Storage Account.
        name: 'pe'
        properties: {
          addressPrefix: '10.20.2.16/28'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

// Private DNS zone for Postgres — required when Flex Server is in a VNet.
resource pgDns 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'
  tags: tags
}

resource pgDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: pgDns
  name: '${vnetName}-pg-link'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnet.id }
    registrationEnabled: false
  }
}

output vnetId string = vnet.id
output acaSubnetId string = vnet.properties.subnets[0].id
output dbSubnetId string = vnet.properties.subnets[1].id
output peSubnetId string = vnet.properties.subnets[2].id
output pgPrivateDnsZoneId string = pgDns.id
