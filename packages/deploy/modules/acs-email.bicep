// Azure Communication Services + Email Communication Service.
//
// Two phases:
//   1) Resource creation (here) — provisions ACS, EmailService, and an
//      AzureManagedDomain so the apps can immediately send from
//      `donotreply@<random>.azurecomm.net` for smoke tests.
//   2) Custom-domain attach (manual, see MIGRATION_CHECKLIST.md §2) — once
//      DNS authority is on Azure, attach `techseeding.com.au` as a custom
//      sender domain. Bicep can declare the CustomerManagedDomain but the
//      DKIM/SPF/DMARC TXT records must be added to the DNS zone before
//      Azure verifies it.

@description('Azure region for the ACS resource (must be a region that supports ACS Email — typically global or US).')
param location string = 'global'

@description('Region for the Email Communication Service data residency. Use australia for AU workloads.')
param emailDataLocation string = 'australia'

@description('Tags applied to all resources.')
param tags object = {}

@description('Name of the ACS resource.')
param acsName string

@description('Name of the Email Communication Service.')
param emailServiceName string

@description('Custom sender domain (e.g. techseeding.com.au). Verification is manual — see MIGRATION_CHECKLIST.md.')
param customDomainName string = ''

resource emailService 'Microsoft.Communication/emailServices@2025-09-01' = {
  name: emailServiceName
  location: location
  tags: tags
  properties: { dataLocation: emailDataLocation }
}

// AzureManagedDomain is auto-verified — usable immediately for smoke tests.
resource managedDomain 'Microsoft.Communication/emailServices/domains@2025-09-01' = {
  parent: emailService
  name: 'AzureManagedDomain'
  location: location
  tags: tags
  properties: {
    domainManagement: 'AzureManaged'
    userEngagementTracking: 'Disabled'
  }
}

// CustomerManagedDomain — declared in unverified state so the verification
// TXT records are visible in the portal. ACS can't *link* the domain until
// it's been verified (DNS authority on Azure + DKIM/SPF/DMARC records in
// place), so we don't add it to `linkedDomains` here. Re-deploy with
// `linkCustomDomain=true` once verification lands (see MIGRATION_CHECKLIST §2).
resource customDomain 'Microsoft.Communication/emailServices/domains@2025-09-01' = if (!empty(customDomainName)) {
  parent: emailService
  name: customDomainName
  location: location
  tags: tags
  properties: {
    domainManagement: 'CustomerManaged'
    userEngagementTracking: 'Disabled'
  }
}

@description('Set to true once the customer-managed domain has been verified — links it to the ACS resource so apps can send from it.')
param linkCustomDomain bool = false

resource acs 'Microsoft.Communication/communicationServices@2025-09-01' = {
  name: acsName
  location: location
  tags: tags
  properties: {
    dataLocation: emailDataLocation
    linkedDomains: linkCustomDomain && !empty(customDomainName)
      ? [managedDomain.id, customDomain.id]
      : [managedDomain.id]
  }
}

output acsId string = acs.id
output acsHostname string = acs.properties.hostName
output managedDomainName string = managedDomain.properties.fromSenderDomain
#disable-next-line outputs-should-not-contain-secrets
output acsConnectionString string = acs.listKeys().primaryConnectionString
