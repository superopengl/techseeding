// One-shot Container Apps Job — used to run drizzle migrations against the
// Postgres Flexible Server. Triggered manually via `az containerapp job start`.

@description('Azure region.')
param location string

@description('Tags applied to the resource.')
param tags object = {}

@description('Job name.')
param name string

@description('Managed Environment ID.')
param environmentId string

@description('Container image (same as the app — running a different command).')
param image string

@description('Container Registry login server.')
param acrLoginServer string

@description('Command + args to run inside the container.')
param command array

@description('Plain env vars.')
param envVars array = []

@description('Secret refs (same shape as container-app).')
param secretRefs array = []

@description('Env vars that reference secrets.')
param envSecretRefs array = []

@description('Resource requests.')
param resources object = {
  cpu: json('0.5')
  memory: '1Gi'
}

@description('Timeout in seconds.')
param replicaTimeout int = 600

var formatSecrets = [for s in secretRefs: {
  name: s.appSecretName
  keyVaultUrl: s.keyVaultSecretUri
  identity: 'system'
}]

resource job 'Microsoft.App/jobs@2025-02-02-preview' = {
  name: name
  location: location
  tags: tags
  identity: { type: 'SystemAssigned' }
  properties: {
    environmentId: environmentId
    workloadProfileName: 'Consumption'
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: replicaTimeout
      replicaRetryLimit: 0
      manualTriggerConfig: {
        replicaCompletionCount: 1
        parallelism: 1
      }
      registries: [
        {
          server: acrLoginServer
          identity: 'system'
        }
      ]
      secrets: formatSecrets
    }
    template: {
      containers: [
        {
          name: name
          image: image
          command: command
          resources: resources
          env: concat(envVars, envSecretRefs)
        }
      ]
    }
  }
}

output id string = job.id
output principalId string = job.identity.principalId
output name string = job.name
