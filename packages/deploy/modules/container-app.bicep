// Reusable Container App module. One app per invocation (kpai, ytai).
//
// Identity model: every app uses the same User-Assigned Managed Identity
// created in main.bicep (modules/managed-identity.bicep). That UAMI has
// AcrPull, Key Vault Secrets User, and Storage Blob Data Contributor
// granted up-front so the first revision can pull the image and read
// KV secrets without a chicken-and-egg cycle.

@description('Azure region.')
param location string

@description('Tags applied to the resource.')
param tags object = {}

@description('App name (also the resource name).')
param name string

@description('Managed Environment ID this app deploys into.')
param environmentId string

@description('Container image (full registry/repo:tag).')
param image string

@description('Container Registry login server (e.g. techseedingacr.azurecr.io).')
param acrLoginServer string

@description('User-Assigned Managed Identity resource ID. Used for ACR pull, KV secret fetch, and Storage access.')
param uamiId string

@description('External HTTPS ingress? false for internal-only apps.')
param externalIngress bool = true

@description('Target port the container listens on.')
param targetPort int = 80

@description('Resource requests (CPU and memory).')
param resources object = {
  cpu: json('0.5')
  memory: '1Gi'
}

@description('Min and max replicas.')
param minReplicas int = 1
param maxReplicas int = 3

@description('Plain env vars (no secrets). Array of {name, value}.')
param envVars array = []

@description('Secret refs. Array of {appSecretName, keyVaultSecretUri}. Each entry creates a Container Apps secret pulling from KV via the system MI.')
param secretRefs array = []

@description('Env vars that reference container-apps secrets. Array of {name, secretRef}.')
param envSecretRefs array = []

@description('Volume mounts. Array of {volumeName, mountPath}.')
param volumeMounts array = []

@description('Managed Environment storage names to project as volumes. Array of {name, storageName}.')
param volumes array = []

@description('Custom domain hostname. Empty = use the managed FQDN only.')
param customDomain string = ''

@description('Container Apps managed certificate ID for the custom domain. Empty until cert is issued.')
param managedCertificateId string = ''

var formatSecrets = [for s in secretRefs: {
  name: s.appSecretName
  keyVaultUrl: s.keyVaultSecretUri
  identity: uamiId
}]

resource app 'Microsoft.App/containerApps@2025-02-02-preview' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${uamiId}': {}
    }
  }
  properties: {
    managedEnvironmentId: environmentId
    workloadProfileName: 'Consumption'
    configuration: {
      ingress: {
        external: externalIngress
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
        traffic: [{ latestRevision: true, weight: 100 }]
        customDomains: empty(customDomain) ? [] : [
          {
            name: customDomain
            bindingType: empty(managedCertificateId) ? 'Disabled' : 'SniEnabled'
            certificateId: empty(managedCertificateId) ? null : managedCertificateId
          }
        ]
      }
      registries: [
        {
          server: acrLoginServer
          identity: uamiId
        }
      ]
      secrets: formatSecrets
    }
    template: {
      containers: [
        {
          name: name
          image: image
          resources: resources
          env: concat(envVars, envSecretRefs)
          volumeMounts: volumeMounts
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
      volumes: [for v in volumes: {
        name: v.name
        storageType: 'AzureFile'
        storageName: v.storageName
      }]
    }
  }
}

output id string = app.id
output fqdn string = app.properties.configuration.ingress.fqdn
output latestRevisionName string = app.properties.latestRevisionName
