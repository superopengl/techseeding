import { Stack, Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Vpc, SubnetType, Port, SecurityGroup, Peer } from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  ContainerInsights,
  FargateTaskDefinition,
  ContainerImage,
  Secret as EcsSecret,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { FileSystem, PerformanceMode, ThroughputMode } from "aws-cdk-lib/aws-efs";
import {
  DatabaseCluster,
  DatabaseClusterEngine,
  AuroraPostgresEngineVersion,
  ClusterInstance,
  Credentials,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { HostedZone, ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Repository } from "aws-cdk-lib/aws-ecr";
import {
  Distribution,
  ViewerProtocolPolicy,
  CachePolicy,
  OriginRequestPolicy,
  AllowedMethods,
  CachedMethods,
  OriginProtocolPolicy,
  PriceClass,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

export class KidPlayAiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const { stage, domainName, hostedZoneName, appRepoName, imageTag, cdnCertificate } = props;
    const appRepo = Repository.fromRepositoryName(this, "AppRepo", appRepoName);
    const isProd = stage === "prod";
    const originDomainName = domainName ? `origin.${domainName}` : undefined;

    const vpc = new Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "Public", subnetType: SubnetType.PUBLIC, cidrMask: 24 },
        { name: "Isolated", subnetType: SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    const dbCluster = new DatabaseCluster(this, "Database", {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_17_9,
      }),
      credentials: Credentials.fromGeneratedSecret("kpai", {
        secretName: `kpai/${stage}/db`,
      }),
      defaultDatabaseName: "kpai",
      writer: ClusterInstance.serverlessV2("Writer", { publiclyAccessible: true }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      storageEncrypted: true,
      backup: { retention: Duration.days(isProd ? 7 : 1) },
      removalPolicy: isProd ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    const sandboxFs = new FileSystem(this, "SandboxFs", {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      performanceMode: PerformanceMode.GENERAL_PURPOSE,
      throughputMode: ThroughputMode.BURSTING,
      encrypted: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });
    const sandboxAccessPoint = sandboxFs.addAccessPoint("SandboxAp", {
      path: "/sandbox",
      createAcl: { ownerUid: "0", ownerGid: "0", permissions: "755" },
      posixUser: { uid: "0", gid: "0" },
    });

    const jwtSecret = new Secret(this, "JwtSecret", {
      secretName: `kpai/${stage}/jwt`,
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    const deepseekSecret = new Secret(this, "DeepseekKey", {
      secretName: `kpai/${stage}/deepseek`,
      description:
        "Populate after first deploy: aws secretsmanager put-secret-value --secret-id kpai/<stage>/deepseek --secret-string sk-...",
    });

    const ecsCluster = new Cluster(this, "Cluster", {
      vpc,
      containerInsightsV2: ContainerInsights.ENABLED,
    });

    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: `/kpai/${stage}`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const taskDef = new FargateTaskDefinition(this, "Task", {
      cpu: 1024,
      memoryLimitMiB: 2048,
      volumes: [
        {
          name: "sandbox",
          efsVolumeConfiguration: {
            fileSystemId: sandboxFs.fileSystemId,
            transitEncryption: "ENABLED",
            authorizationConfig: {
              accessPointId: sandboxAccessPoint.accessPointId,
              iam: "ENABLED",
            },
          },
        },
      ],
    });
    sandboxFs.grantRootAccess(taskDef.taskRole);

    const container = taskDef.addContainer("App", {
      image: ContainerImage.fromEcrRepository(appRepo, imageTag),
      logging: LogDrivers.awsLogs({ logGroup, streamPrefix: "app" }),
      environment: {
        NODE_ENV: "production",
        RUN_MIGRATIONS: "true",
        TMPDIR: "/var/kpai",
        KPAI_API_PORT: "80",
        KPAI_PUBLIC_URL: domainName ? `https://${domainName}` : "http://0.0.0.0:80",
      },
      secrets: {
        PG_HOST: EcsSecret.fromSecretsManager(dbCluster.secret, "host"),
        PG_PORT: EcsSecret.fromSecretsManager(dbCluster.secret, "port"),
        PG_USER: EcsSecret.fromSecretsManager(dbCluster.secret, "username"),
        PG_PASSWORD: EcsSecret.fromSecretsManager(dbCluster.secret, "password"),
        PG_DATABASE: EcsSecret.fromSecretsManager(dbCluster.secret, "dbname"),
        KPAI_JWT_SECRET: EcsSecret.fromSecretsManager(jwtSecret),
        KPAI_SANDBOX_DEEPSEEK_API_KEY: EcsSecret.fromSecretsManager(deepseekSecret),
      },
      portMappings: [{ containerPort: 80 }],
    });
    container.addMountPoints({
      containerPath: "/var/kpai",
      sourceVolume: "sandbox",
      readOnly: false,
    });

    const domainZone = hostedZoneName
      ? HostedZone.fromLookup(this, "Zone", { domainName: hostedZoneName })
      : undefined;

    // Pre-create the Fargate service security group so EFS/DB ingress rules
    // can reference it without forming a CloudFormation circular dependency
    // through the auto-created service SG.
    const serviceSg = new SecurityGroup(this, "ServiceSecurityGroup", {
      vpc,
      description: "kpai Fargate service",
      allowAllOutbound: true,
    });

    dbCluster.connections.allowFrom(serviceSg, Port.tcp(5432), "Fargate to Aurora");
    // Open 5432 to the internet so the DB can be reached from a local psql
    // client with username/password. Lock this down to a specific CIDR (e.g.
    // your office IP) before treating prod data as sensitive.
    dbCluster.connections.allowFrom(Peer.anyIpv4(), Port.tcp(5432), "Public psql access");
    sandboxFs.connections.allowFrom(serviceSg, Port.tcp(2049), "Fargate to EFS");

    const service = new ApplicationLoadBalancedFargateService(this, "Service", {
      cluster: ecsCluster,
      taskDefinition: taskDef,
      securityGroups: [serviceSg],
      desiredCount: 1,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      publicLoadBalancer: true,
      assignPublicIp: true,
      taskSubnets: { subnetType: SubnetType.PUBLIC },
      protocol: originDomainName ? ApplicationProtocol.HTTPS : ApplicationProtocol.HTTP,
      redirectHTTP: !!originDomainName,
      domainName: originDomainName,
      domainZone,
      healthCheckGracePeriod: Duration.seconds(300),
      circuitBreaker: { rollback: true },
    });

    service.targetGroup.configureHealthCheck({
      path: "/healthcheck",
      interval: Duration.seconds(30),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    service.loadBalancer.setAttribute("idle_timeout.timeout_seconds", "3600");

    // CloudFront in front of the ALB. Caches /assets/* (Vite-hashed bundles) at
    // the edge so the single Fargate task isn't the bottleneck for static
    // delivery; passes /api/* and the SPA HTML through uncached.
    let distribution;
    if (domainName && originDomainName && cdnCertificate && domainZone) {
      const origin = new HttpOrigin(originDomainName, {
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
        readTimeout: Duration.seconds(60),
        keepaliveTimeout: Duration.seconds(60),
      });

      const passThrough = {
        origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        compress: true,
      };

      distribution = new Distribution(this, "Cdn", {
        comment: `kpai ${stage}`,
        domainNames: [domainName],
        certificate: cdnCertificate,
        priceClass: PriceClass.PRICE_CLASS_ALL,
        defaultBehavior: passThrough,
        additionalBehaviors: {
          "/assets/*": {
            origin,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: CachePolicy.CACHING_OPTIMIZED,
            allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
            compress: true,
          },
          "/api/*": passThrough,
          "/healthcheck": passThrough,
        },
      });

      new ARecord(this, "ApexAlias", {
        zone: domainZone,
        recordName: domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      });
    }

    new CfnOutput(this, "ClusterName", { value: ecsCluster.clusterName });
    new CfnOutput(this, "ServiceName", { value: service.service.serviceName });
    new CfnOutput(this, "LoadBalancerDns", { value: service.loadBalancer.loadBalancerDnsName });
    new CfnOutput(this, "DbSecretArn", { value: dbCluster.secret.secretArn });
    new CfnOutput(this, "DbClusterEndpoint", { value: dbCluster.clusterEndpoint.hostname });
    new CfnOutput(this, "JwtSecretArn", { value: jwtSecret.secretArn });
    new CfnOutput(this, "DeepseekSecretArn", { value: deepseekSecret.secretArn });
    new CfnOutput(this, "ImageTag", { value: imageTag });
    if (distribution) {
      new CfnOutput(this, "CdnDomain", { value: distribution.distributionDomainName });
      new CfnOutput(this, "CdnDistributionId", { value: distribution.distributionId });
    }
  }
}
