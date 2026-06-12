using '../main.bicep'

param location = 'australiaeast'
param resourceGroupName = 'techseeding-rg'
param namePrefix = 'techseeding'
param dnsZoneName = 'techseeding.com.au'
param pgAdminUsername = 'pgadmin'

// pgAdminPassword is injected at deploy time:
//   AZURE_PG_ADMIN_PASSWORD=... ./scripts/deploy-all.sh
// Bicepparam reads from env via getSecret() pattern.
param pgAdminPassword = readEnvironmentVariable('AZURE_PG_ADMIN_PASSWORD', '')

// Object IDs of users/principals that should be able to seed Key Vault
// secret values. Get yours with `az ad signed-in-user show --query id -o tsv`
// and set it via env or hardcode here for convenience.
param keyVaultAdminPrincipalIds = empty(readEnvironmentVariable('AZURE_KV_ADMIN_PRINCIPAL_ID', ''))
  ? []
  : [readEnvironmentVariable('AZURE_KV_ADMIN_PRINCIPAL_ID', '')]

param tags = {
  project: 'techseeding'
  managedBy: 'bicep'
  env: 'prod'
}
