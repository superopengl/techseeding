import { Stack, Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import {
  Vpc,
  SubnetType,
  InstanceType,
  InstanceClass,
  InstanceSize,
  Port,
} from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  FargateTaskDefinition,
  ContainerImage,
  Secret as EcsSecret,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Repository, TagMutability } from "aws-cdk-lib/aws-ecr";
import { FileSystem, PerformanceMode, ThroughputMode } from "aws-cdk-lib/aws-efs";
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  Credentials,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { HostedZone } from "aws-cdk-lib/aws-route53";

export class KidPlayAiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const { stage, domainName, hostedZoneId, hostedZoneName } = props;
    const isProd = stage === "prod";

    const vpc = new Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: "Public", subnetType: SubnetType.PUBLIC, cidrMask: 24 },
        { name: "Private", subnetType: SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: "Isolated", subnetType: SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    const dbSecret = new Secret(this, "DbCredentials", {
      secretName: `kidplayai/${stage}/db`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "kidplayai" }),
        generateStringKey: "password",
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const db = new DatabaseInstance(this, "Database", {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_16_3 }),
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      credentials: Credentials.fromSecret(dbSecret),
      databaseName: "kidplayai",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: Duration.days(isProd ? 7 : 1),
      removalPolicy: isProd ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY,
      deletionProtection: isProd,
    });

    const sandboxFs = new FileSystem(this, "SandboxFs", {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
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

    const repo = new Repository(this, "Repository", {
      repositoryName: `kidplayai-${stage}`,
      imageTagMutability: TagMutability.MUTABLE,
      lifecycleRules: [{ maxImageCount: 20 }],
      removalPolicy: RemovalPolicy.RETAIN,
      emptyOnDelete: false,
    });

    const jwtSecret = new Secret(this, "JwtSecret", {
      secretName: `kidplayai/${stage}/jwt`,
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    const deepseekSecret = new Secret(this, "DeepseekKey", {
      secretName: `kidplayai/${stage}/deepseek`,
      description:
        "Populate after first deploy: aws secretsmanager put-secret-value --secret-id kidplayai/<stage>/deepseek --secret-string sk-...",
    });

    const cluster = new Cluster(this, "Cluster", { vpc, containerInsights: true });

    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: `/kidplayai/${stage}`,
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
      image: ContainerImage.fromEcrRepository(repo, "latest"),
      logging: LogDrivers.awsLogs({ logGroup, streamPrefix: "app" }),
      environment: {
        NODE_ENV: "production",
        RUN_MIGRATIONS: "true",
        TMPDIR: "/var/kidplayai",
        KPAI_API_SERVICE_URL: domainName ? `https://${domainName}` : "http://0.0.0.0:80",
      },
      secrets: {
        PG_HOST: EcsSecret.fromSecretsManager(dbSecret, "host"),
        PG_PORT: EcsSecret.fromSecretsManager(dbSecret, "port"),
        PG_USER: EcsSecret.fromSecretsManager(dbSecret, "username"),
        PG_PASSWORD: EcsSecret.fromSecretsManager(dbSecret, "password"),
        PG_DATABASE: EcsSecret.fromSecretsManager(dbSecret, "dbname"),
        KPAI_JWT_SECRET: EcsSecret.fromSecretsManager(jwtSecret),
        KPAI_SANDBOX_DEEPSEEK_API_KEY: EcsSecret.fromSecretsManager(deepseekSecret),
      },
      portMappings: [{ containerPort: 80 }],
    });
    container.addMountPoints({
      containerPath: "/var/kidplayai",
      sourceVolume: "sandbox",
      readOnly: false,
    });

    const domainZone =
      hostedZoneId && hostedZoneName
        ? HostedZone.fromHostedZoneAttributes(this, "Zone", {
            hostedZoneId,
            zoneName: hostedZoneName,
          })
        : undefined;

    const service = new ApplicationLoadBalancedFargateService(this, "Service", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      publicLoadBalancer: true,
      assignPublicIp: false,
      taskSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      protocol: domainName ? ApplicationProtocol.HTTPS : ApplicationProtocol.HTTP,
      redirectHTTP: !!domainName,
      domainName,
      domainZone,
      healthCheckGracePeriod: Duration.seconds(60),
      circuitBreaker: { rollback: true },
    });

    service.targetGroup.configureHealthCheck({
      path: "/healthcheck",
      interval: Duration.seconds(30),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    service.loadBalancer.setAttribute("idle_timeout.timeout_seconds", "3600");

    db.connections.allowFrom(service.service, Port.tcp(5432), "Fargate -> RDS");
    sandboxFs.connections.allowFrom(service.service, Port.tcp(2049), "Fargate -> EFS");

    new CfnOutput(this, "EcrRepositoryUri", { value: repo.repositoryUri });
    new CfnOutput(this, "ClusterName", { value: cluster.clusterName });
    new CfnOutput(this, "ServiceName", { value: service.service.serviceName });
    new CfnOutput(this, "LoadBalancerDns", { value: service.loadBalancer.loadBalancerDnsName });
    new CfnOutput(this, "DbSecretArn", { value: dbSecret.secretArn });
    new CfnOutput(this, "JwtSecretArn", { value: jwtSecret.secretArn });
    new CfnOutput(this, "DeepseekSecretArn", { value: deepseekSecret.secretArn });
  }
}
