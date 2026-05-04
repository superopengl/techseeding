import path from "path";
import { fileURLToPath } from "url";
import { Stack, Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Vpc, SubnetType, Port } from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  ContainerInsights,
  FargateTaskDefinition,
  ContainerImage,
  Secret as EcsSecret,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
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
import { HostedZone } from "aws-cdk-lib/aws-route53";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

export class KidPlayAiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const { stage, domainName, hostedZoneName } = props;
    const isProd = stage === "prod";

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
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_16_6,
      }),
      credentials: Credentials.fromGeneratedSecret("kidplayai", {
        secretName: `kidplayai/${stage}/db`,
      }),
      defaultDatabaseName: "kidplayai",
      writer: ClusterInstance.serverlessV2("Writer"),
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

    const appImage = new DockerImageAsset(this, "AppImage", {
      directory: repoRoot,
      file: "devops/Dockerfile",
      platform: Platform.LINUX_AMD64,
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

    const ecsCluster = new Cluster(this, "Cluster", {
      vpc,
      containerInsightsV2: ContainerInsights.ENABLED,
    });

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
      image: ContainerImage.fromDockerImageAsset(appImage),
      logging: LogDrivers.awsLogs({ logGroup, streamPrefix: "app" }),
      environment: {
        NODE_ENV: "production",
        RUN_MIGRATIONS: "true",
        TMPDIR: "/var/kidplayai",
        KPAI_API_SERVICE_URL: domainName ? `https://${domainName}` : "http://0.0.0.0:80",
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
      containerPath: "/var/kidplayai",
      sourceVolume: "sandbox",
      readOnly: false,
    });

    const domainZone = hostedZoneName
      ? HostedZone.fromLookup(this, "Zone", { domainName: hostedZoneName })
      : undefined;

    const service = new ApplicationLoadBalancedFargateService(this, "Service", {
      cluster: ecsCluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      publicLoadBalancer: true,
      assignPublicIp: true,
      taskSubnets: { subnetType: SubnetType.PUBLIC },
      protocol: domainName ? ApplicationProtocol.HTTPS : ApplicationProtocol.HTTP,
      redirectHTTP: !!domainName,
      domainName,
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

    dbCluster.connections.allowFrom(service.service, Port.tcp(5432), "Fargate to Aurora");
    sandboxFs.connections.allowFrom(service.service, Port.tcp(2049), "Fargate to EFS");

    new CfnOutput(this, "ClusterName", { value: ecsCluster.clusterName });
    new CfnOutput(this, "ServiceName", { value: service.service.serviceName });
    new CfnOutput(this, "LoadBalancerDns", { value: service.loadBalancer.loadBalancerDnsName });
    new CfnOutput(this, "DbSecretArn", { value: dbCluster.secret.secretArn });
    new CfnOutput(this, "DbClusterEndpoint", { value: dbCluster.clusterEndpoint.hostname });
    new CfnOutput(this, "JwtSecretArn", { value: jwtSecret.secretArn });
    new CfnOutput(this, "DeepseekSecretArn", { value: deepseekSecret.secretArn });
  }
}
