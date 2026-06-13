// Azure Static Web Apps for txd. Free SKU is fine — single static site.
// Deploys via the `swa` CLI from packages/deploy/scripts/release-txd.sh.

@description('Region. Static Web Apps only deploy in: centralus, eastus2, westus2, westeurope, eastasia. Content is served from Microsoft\'s global CDN regardless of this choice — pick the closest control-plane region to your team. eastasia is the closest to Australia.')
param location string = 'eastasia'

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
