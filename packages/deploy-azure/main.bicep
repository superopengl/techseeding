// Subscription-scoped entry point. Creates the resource group and everything
// inside it. Run via:
//   az deployment sub create \
//     --location <region> \
//     --template-file main.bicep \
//     --parameters params/prod.bicepparam
//
// What it does NOT do (manual steps in MIGRATION_CHECKLIST.md):
//   - Update the registrar's NS records to point at Azure DNS
//   - Add ACS Email DKIM/SPF/DMARC TXT records to the DNS zone
//   - Seed Key Vault secret values (use scripts/seed-secrets.sh)
//   - Push container images to ACR (use scripts/release-{kpai,ytai}.sh)
//   - Bind the managed certs to the container apps' custom domains
//     (the apps deploy with managed FQDNs first; cert binding is a second
//     pass after DNS authority is confirmed)

targetScope = 'subscription'

@description('Azure region for the resource group and most resources.')
param location string = 'australiaeast'

@description('Resource group name.')
param resourceGroupName string = 'techseeding-rg'

@description('Naming prefix for resources (lowercase, alphanumeric, 3-15 chars).')
@minLength(3)
@maxLength(15)
param namePrefix string = 'techseeding'

@description('Apex DNS zone (e.g. techseeding.com.au).')
param dnsZoneName string

@description('Postgres admin username.')
param pgAdminUsername string = 'pgadmin'

@description('Postgres admin password. Pass via bicepparam or env var; never commit.')
@secure()
param pgAdminPassword string

@description('Principal IDs that need Key Vault Secrets Officer (for seed-secrets.sh).')
param keyVaultAdminPrincipalIds array = []

@description('Tags applied to every resource.')
param tags object = {
  project: 'techseeding'
  managedBy: 'bicep'
}

// ─── Resource Group ─────────────────────────────────────────────────────────

resource rg 'Microsoft.Resources/resourceGroups@2024-11-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ─── Networking ─────────────────────────────────────────────────────────────

module network 'modules/network.bicep' = {
  scope: rg
  name: 'network'
  params: {
    location: location
    tags: tags
    namePrefix: namePrefix
  }
}

// ─── Observability ──────────────────────────────────────────────────────────

module logAnalytics 'modules/log-analytics.bicep' = {
  scope: rg
  name: 'log-analytics'
  params: {
    location: location
    tags: tags
    name: '${namePrefix}-logs'
  }
}

// ─── Container Registry ─────────────────────────────────────────────────────

module acr 'modules/acr.bicep' = {
  scope: rg
  name: 'acr'
  params: {
    location: location
    tags: tags
    name: '${namePrefix}acr'
  }
}

// ─── Postgres ───────────────────────────────────────────────────────────────

module postgres 'modules/postgres.bicep' = {
  scope: rg
  name: 'postgres'
  params: {
    location: location
    tags: tags
    name: '${namePrefix}-pg'
    adminUsername: pgAdminUsername
    adminPassword: pgAdminPassword
    delegatedSubnetId: network.outputs.dbSubnetId
    privateDnsZoneId: network.outputs.pgPrivateDnsZoneId
  }
}

// ─── Storage ────────────────────────────────────────────────────────────────

module storage 'modules/storage.bicep' = {
  scope: rg
  name: 'storage'
  params: {
    location: location
    tags: tags
    name: '${namePrefix}sa'
  }
}

// ─── Key Vault ──────────────────────────────────────────────────────────────

module keyVault 'modules/keyvault.bicep' = {
  scope: rg
  name: 'keyvault'
  params: {
    location: location
    tags: tags
    name: '${namePrefix}-kv'
    adminPrincipalIds: keyVaultAdminPrincipalIds
  }
}

// ─── DNS ────────────────────────────────────────────────────────────────────

module dns 'modules/dns.bicep' = {
  scope: rg
  name: 'dns'
  params: {
    zoneName: dnsZoneName
    tags: tags
  }
}

// ─── ACS Email ──────────────────────────────────────────────────────────────

module acsEmail 'modules/acs-email.bicep' = {
  scope: rg
  name: 'acs-email'
  params: {
    tags: tags
    acsName: '${namePrefix}-acs'
    emailServiceName: '${namePrefix}-email'
    customDomainName: dnsZoneName
  }
}

// ─── Container Apps Environment ─────────────────────────────────────────────

// Existing-resource handle so we can call `listKeys()` on the storage account
// the storage module deploys, without violating BCP181 (which forbids
// listKeys on a value that depends on module outputs).
resource storageRef 'Microsoft.Storage/storageAccounts@2024-01-01' existing = {
  scope: rg
  name: '${namePrefix}sa'
}

module containerAppsEnv 'modules/container-apps-env.bicep' = {
  scope: rg
  name: 'aca-env'
  params: {
    location: location
    tags: tags
    name: '${namePrefix}-env'
    infrastructureSubnetId: network.outputs.acaSubnetId
    logAnalyticsCustomerId: logAnalytics.outputs.customerId
    logAnalyticsSharedKey: logAnalytics.outputs.sharedKey
    storageAccountName: storage.outputs.name
    storageAccountKey: storageRef.listKeys().keys[0].value
    fileShareName: storage.outputs.kpaiSandboxesShare
    storageVolumeName: 'kpai-sandboxes-mount'
  }
}

// ─── Static Web App (txd) ───────────────────────────────────────────────────

module staticWebApp 'modules/static-web-app.bicep' = {
  scope: rg
  name: 'txd-swa'
  params: {
    tags: tags
    name: '${namePrefix}-txd'
  }
}

// ─── Outputs ────────────────────────────────────────────────────────────────

output resourceGroupName string = rg.name
output dnsNameServers array = dns.outputs.nameServers
output dnsZoneName string = dns.outputs.zoneName
output acrLoginServer string = acr.outputs.loginServer
output acrName string = acr.outputs.name
output postgresFqdn string = postgres.outputs.fqdn
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.uri
output containerAppsEnvId string = containerAppsEnv.outputs.id
output containerAppsEnvStaticIp string = containerAppsEnv.outputs.staticIp
output storageAccountName string = storage.outputs.name
output storageBlobEndpoint string = storage.outputs.blobEndpoint
output ytaiImagesContainer string = storage.outputs.ytaiImagesContainer
output txdStaticContainer string = storage.outputs.txdStaticContainer
output kpaiSandboxesShare string = storage.outputs.kpaiSandboxesShare
output acsHostname string = acsEmail.outputs.acsHostname
output acsManagedDomainSender string = acsEmail.outputs.managedDomainName
output staticWebAppHostname string = staticWebApp.outputs.defaultHostname
output staticWebAppName string = staticWebApp.outputs.name
