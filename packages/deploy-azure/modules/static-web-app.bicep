// Azure Static Web Apps for txd. Free SKU is fine — single static site.
// Deploys via the `swa` CLI from packages/deploy-azure/scripts/release-txd.sh.

@description('Region. SWA is multi-region; "westus2" is a common default for free tier.')
param location string = 'westus2'

@description('Tags applied to the resource.')
param tags object = {}

@description('Static Web App name.')
param name string

resource swa 'Microsoft.Web/staticSites@2024-11-01' = {
  name: name
  location: location
  tags: tags
  sku: { name: 'Free', tier: 'Free' }
  properties: {
    repositoryUrl: ''
    branch: ''
    buildProperties: {
      appLocation: 'apps/txd'
      outputLocation: 'build'
    }
  }
}

output id string = swa.id
output defaultHostname string = swa.properties.defaultHostname
output name string = swa.name
