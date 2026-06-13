// Azure DNS zone for the apex domain. App-specific A/CNAME records get added
// after the Container Apps come up (they need to point at ACA's ingress IPs,
// which are only known after the apps deploy).
//
// The 4 nameservers Azure assigns are output for the registrar NS update.

@description('Apex domain name (e.g. techseeding.com.au).')
param zoneName string

@description('Tags applied to the zone.')
param tags object = {}

resource zone 'Microsoft.Network/dnsZones@2023-07-01-preview' = {
  name: zoneName
  location: 'global'
  tags: tags
  properties: { zoneType: 'Public' }
}

output zoneName string = zone.name
output nameServers array = zone.properties.nameServers
output zoneId string = zone.id
