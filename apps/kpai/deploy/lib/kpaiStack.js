import { Stack, Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { AutoScalingGroup, SpotAllocationStrategy } from "aws-cdk-lib/aws-autoscaling";
import {
  Vpc,
  SubnetType,
  Port,
  SecurityGroup,
  Peer,
  InstanceType,
  LaunchTemplate,
  UserData,
} from "aws-cdk-lib/aws-ec2";
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from "aws-cdk-lib/aws-iam";
import {
  Cluster,
  ContainerInsights,
  Ec2TaskDefinition,
  Ec2Service,
  AsgCapacityProvider,
  EcsOptimizedImage,
  NetworkMode,
  ContainerImage,
  Secret as EcsSecret,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
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
import {
  ApplicationLoadBalancer,
  ApplicationListener,
  ApplicationTargetGroup,
  ApplicationProtocol,
  ListenerAction,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { HostedZone, ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import {
  LoadBalancerTarget,
  CloudFrontTarget,
} from "aws-cdk-lib/aws-route53-targets";
import { Repository } from "aws-cdk-lib/aws-ecr";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import {
  Distribution,
  ViewerProtocolPolicy,
  CachePolicy,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CacheQueryStringBehavior,
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
    const {
      stage,
      domainName,
      hostedZoneName,
      appRepoName,
      imageTag,
      cdnCertificateArn,
      dbPubliclyAccessible = false,
    } = props;
    const appRepo = Repository.fromRepositoryName(this, "AppRepo", appRepoName);
    const isProd = stage === "prod";
    const cdnCertificate = cdnCertificateArn
      ? Certificate.fromCertificateArn(this, "CdnCert", cdnCertificateArn)
      : undefined;
    // When CloudFront is in front of the ALB, the ALB takes the `origin.*`
    // subdomain and the apex is owned by the distribution. Without a CDN cert
    // the ALB keeps the apex.
    const albDomainName = domainName
      ? cdnCertificate ? `origin.${domainName}` : domainName
      : undefined;

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
      writer: ClusterInstance.serverlessV2("Writer", { publiclyAccessible: dbPubliclyAccessible }),
      serverlessV2MinCapacity: 0,
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
      containerInsightsV2: ContainerInsights.ENHANCED,
    });

    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: `/kpai/${stage}`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // === EC2 capacity ========================================================
    //
    // Single Spot-backed ASG that hosts the ECS tasks. Three instance types
    // (t3.large, t3a.large, m5.large) span separate Spot pools so reclaim
    // probability is the minimum of the three. desiredCapacity=1 keeps the
    // cluster at a single host — this is a prototype, not HA. Managed
    // draining lets ECS shut tasks down cleanly on Spot reclaim; managed
    // termination protection would need a 2nd instance to drain *to* so it's
    // off (would just block forever at max=1).

    const instanceRole = new Role(this, "InstanceRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonEC2ContainerServiceforEC2Role",
        ),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
      ],
    });

    // The instance SG replaces the per-Fargate-task service SG. In bridge
    // mode every task on the instance shares this SG. The construct ID stays
    // `ServiceSecurityGroup` so the CFN logical ID — and every ingress rule
    // referencing it (Aurora, EFS, ALB→service) — carries over unchanged.
    const instanceSg = new SecurityGroup(this, "ServiceSecurityGroup", {
      vpc,
      description: "kpai Fargate service",
      allowAllOutbound: true,
    });

    dbCluster.connections.allowFrom(instanceSg, Port.tcp(5432), "ECS instance to Aurora");
    if (dbPubliclyAccessible) {
      // Open 5432 to the internet so the DB can be reached from a local psql
      // client with username/password. Toggled off by default; enable via
      // `-c dbPubliclyAccessible=true` for occasional admin access. Lock down
      // to a specific CIDR before treating prod data as sensitive.
      dbCluster.connections.allowFrom(Peer.anyIpv4(), Port.tcp(5432), "Public psql access");
    }
    sandboxFs.connections.allowFrom(instanceSg, Port.tcp(2049), "ECS instance to EFS");

    const launchTemplate = new LaunchTemplate(this, "LaunchTemplate", {
      machineImage: EcsOptimizedImage.amazonLinux2023(),
      // Placeholder — actual instance types are picked from the ASG's
      // mixedInstancesPolicy overrides below. Required by CDK.
      instanceType: new InstanceType("t3.large"),
      role: instanceRole,
      securityGroup: instanceSg,
      userData: UserData.custom(
        [
          "#!/bin/bash",
          `echo ECS_CLUSTER=${ecsCluster.clusterName} >> /etc/ecs/ecs.config`,
          "echo ECS_ENABLE_SPOT_INSTANCE_DRAINING=true >> /etc/ecs/ecs.config",
        ].join("\n"),
      ),
    });

    const asg = new AutoScalingGroup(this, "Asg", {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      minCapacity: 1,
      maxCapacity: 1,
      desiredCapacity: 1,
      mixedInstancesPolicy: {
        launchTemplate,
        launchTemplateOverrides: [
          { instanceType: new InstanceType("t3.large") },
          { instanceType: new InstanceType("t3a.large") },
          { instanceType: new InstanceType("m5.large") },
        ],
        instancesDistribution: {
          onDemandBaseCapacity: 0,
          onDemandPercentageAboveBaseCapacity: 0,
          spotAllocationStrategy: SpotAllocationStrategy.CAPACITY_OPTIMIZED,
        },
      },
    });

    const capacityProvider = new AsgCapacityProvider(this, "CapacityProvider", {
      autoScalingGroup: asg,
      enableManagedTerminationProtection: false,
      enableManagedScaling: false,
      enableManagedDraining: true,
    });
    ecsCluster.addAsgCapacityProvider(capacityProvider);

    // === Task definition =====================================================
    //
    // Bridge mode: each task uses the host's network namespace with port
    // mappings rather than its own ENI. ALB target group uses dynamic host
    // port mapping (containerPort:80 → ephemeral host port assigned by ECS).
    // Saves ENIs (a single t3.large only supports 3) and removes per-task SG
    // complexity. The trade-off — all tasks share the instance SG — is fine
    // because both apps need the same egress (Aurora, OpenRouter, S3).

    const taskDef = new Ec2TaskDefinition(this, "Task", {
      networkMode: NetworkMode.BRIDGE,
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
      // EC2 mode requires per-container memory limits. 1.5 GiB hard cap with
      // 1 GiB soft reservation gives kpai room to breathe and leaves the
      // rest of the t3.large's 8 GiB for ytai's heavier merged container.
      memoryLimitMiB: 1536,
      memoryReservationMiB: 1024,
      cpu: 512,
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
      // hostPort omitted (defaults to 0) → ECS assigns an ephemeral host
      // port. ALB target group with TargetType.INSTANCE picks it up.
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

    // === ALB =================================================================

    const albSg = new SecurityGroup(this, "AlbSecurityGroup", {
      vpc,
      description: "Automatically created Security Group for ELB kpaiprodServiceLB",
      allowAllOutbound: true,
    });
    albSg.node.defaultChild.overrideLogicalId("ServiceLBSecurityGroupF7435A5C");

    const albCert = albDomainName && domainZone
      ? new Certificate(this, "AlbCertificate", {
          domainName: albDomainName,
          validation: CertificateValidation.fromDns(domainZone),
        })
      : undefined;
    if (albCert) {
      albCert.node.defaultChild.overrideLogicalId("ServiceCertificateA7C65FE6");
    }

    const alb = new ApplicationLoadBalancer(this, "Alb", {
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      securityGroup: albSg,
    });
    alb.node.defaultChild.overrideLogicalId("ServiceLBE9A1ADBC");
    alb.setAttribute("idle_timeout.timeout_seconds", "3600");

    // Bridge-mode tasks listen on ephemeral host ports (32768–60999 on AL2023);
    // ALB needs an ingress to the EC2 instance SG covering that range.
    // service.attachToApplicationTargetGroup() doesn't wire this up because
    // the connectivity endpoint is the instance, not the task.
    instanceSg.connections.allowFrom(
      albSg,
      Port.tcpRange(32768, 65535),
      "ALB to ECS bridge-mode tasks",
    );

    // INSTANCE target type — ALB registers `(instance-id, ephemeral-port)`
    // tuples. The IP-mode TG from the Fargate era is replaced (TargetType is
    // immutable on AWS::ElasticLoadBalancingV2::TargetGroup).
    const targetGroup = new ApplicationTargetGroup(this, "AlbTargetGroup", {
      vpc,
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.INSTANCE,
      healthCheck: {
        path: "/healthcheck",
        interval: Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });
    targetGroup.setAttribute("stickiness.enabled", "false");
    targetGroup.node.defaultChild.overrideLogicalId(
      "ServiceLBPublicListenerECSGroup0CC8688C",
    );

    const primaryListener = albCert
      ? new ApplicationListener(this, "AlbHttpsListener", {
          loadBalancer: alb,
          port: 443,
          protocol: ApplicationProtocol.HTTPS,
          certificates: [{ certificateArn: albCert.certificateArn }],
          defaultAction: ListenerAction.forward([targetGroup]),
        })
      : new ApplicationListener(this, "AlbHttpListener", {
          loadBalancer: alb,
          port: 80,
          protocol: ApplicationProtocol.HTTP,
          defaultAction: ListenerAction.forward([targetGroup]),
        });
    primaryListener.node.defaultChild.overrideLogicalId(
      "ServiceLBPublicListener46709EAA",
    );

    if (albCert) {
      const httpRedirect = new ApplicationListener(this, "AlbHttpRedirect", {
        loadBalancer: alb,
        port: 80,
        protocol: ApplicationProtocol.HTTP,
        defaultAction: ListenerAction.redirect({
          protocol: "HTTPS",
          port: "443",
          permanent: true,
        }),
      });
      httpRedirect.node.defaultChild.overrideLogicalId(
        "ServiceLBPublicRedirectListenerF055B333",
      );
      httpRedirect.node.addDependency(targetGroup, primaryListener);
    }

    if (domainZone && albDomainName) {
      const albAlias = new ARecord(this, "AlbDnsAlias", {
        zone: domainZone,
        recordName: albDomainName,
        target: RecordTarget.fromAlias(new LoadBalancerTarget(alb)),
      });
      albAlias.node.defaultChild.overrideLogicalId("ServiceDNS57754DD9");
    }

    // === ECS service =========================================================
    //
    // Ec2Service replaces the FargateService; CFN deletes the old service
    // (logical ID Service9571FDD8) and creates a new one. Expect ~2–5 min
    // outage during the swap deploy as the listener flips to the new TG
    // before the new task on the EC2 instance is healthy.

    const service = new Ec2Service(this, "EcsService", {
      cluster: ecsCluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      // Single-instance/single-task: the new task must stop before the new
      // revision starts. Brief outage per deploy is acceptable for prototype.
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      healthCheckGracePeriod: Duration.seconds(300),
      circuitBreaker: { rollback: true },
      capacityProviderStrategies: [
        { capacityProvider: capacityProvider.capacityProviderName, weight: 1 },
      ],
    });
    service.attachToApplicationTargetGroup(targetGroup);

    // CloudFront in front of the ALB. Caches /assets/* (Vite-hashed bundles) at
    // the edge so the single task isn't the bottleneck for static delivery;
    // passes /api/* and the SPA HTML through uncached.
    let distribution;
    if (domainName && albDomainName && cdnCertificate && domainZone) {
      const origin = new HttpOrigin(albDomainName, {
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
        readTimeout: Duration.seconds(60),
        keepaliveTimeout: Duration.seconds(60),
      });

      // Predefined `CACHING_DISABLED` turns off CloudFront's automatic gzip/br
      // compression (it strips Accept-Encoding from the cache key, so the
      // edge has nothing to negotiate). Use a TTL=0 policy that still
      // varies on Accept-Encoding so non-cached responses (HTML, /api/*,
      // /healthcheck) still get compressed at the edge as a fallback when
      // origin compression isn't applied.
      const passThroughCachePolicy = new CachePolicy(this, "PassThroughCompressPolicy", {
        cachePolicyName: `kpai-${stage}-passthrough-compress`,
        comment: "TTL=0 with compression negotiation",
        defaultTtl: Duration.seconds(0),
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(1),
        cookieBehavior: CacheCookieBehavior.none(),
        headerBehavior: CacheHeaderBehavior.none(),
        queryStringBehavior: CacheQueryStringBehavior.none(),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      });

      const passThrough = {
        origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: passThroughCachePolicy,
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
    new CfnOutput(this, "ServiceName", { value: service.serviceName });
    new CfnOutput(this, "LoadBalancerDns", { value: alb.loadBalancerDnsName });
    new CfnOutput(this, "DbSecretArn", { value: dbCluster.secret.secretArn });
    new CfnOutput(this, "DbClusterEndpoint", { value: dbCluster.clusterEndpoint.hostname });
    new CfnOutput(this, "JwtSecretArn", { value: jwtSecret.secretArn });
    new CfnOutput(this, "DeepseekSecretArn", { value: deepseekSecret.secretArn });
    new CfnOutput(this, "ImageTag", { value: imageTag });
    // Outputs consumed by the ytai stack (see ytai/deploy). ytai's release
    // script reads them via aws cloudformation describe-stacks and passes
    // them to cdk deploy as -c context values.
    new CfnOutput(this, "VpcId", { value: vpc.vpcId });
    new CfnOutput(this, "CapacityProviderName", {
      value: capacityProvider.capacityProviderName,
    });
    new CfnOutput(this, "AlbArn", { value: alb.loadBalancerArn });
    new CfnOutput(this, "AlbHttpsListenerArn", { value: primaryListener.listenerArn });
    new CfnOutput(this, "AlbSecurityGroupId", { value: albSg.securityGroupId });
    new CfnOutput(this, "InstanceSecurityGroupId", { value: instanceSg.securityGroupId });
    new CfnOutput(this, "AlbCanonicalHostedZoneId", {
      value: alb.loadBalancerCanonicalHostedZoneId,
    });
    if (distribution) {
      new CfnOutput(this, "CdnDomain", { value: distribution.distributionDomainName });
      new CfnOutput(this, "CdnDistributionId", { value: distribution.distributionId });
    }
  }
}
