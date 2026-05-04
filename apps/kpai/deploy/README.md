# Deploy

AWS CDK app that provisions everything needed to host KidPlayAI: VPC, RDS Postgres, EFS (sandbox persistence), ECR, Fargate service, ALB, secrets, and (optionally) Route53 + ACM.

## Architecture

```
ALB (HTTPS)
  └─ Fargate Service (1 task, public subnet behind ALB)
       ├─ Container: techseeding/kidplayai (port 80)
       ├─ EFS mount: /var/kidplayai  ← sandbox folders (TMPDIR override)
       ├─ Secrets:   PG_*, KPAI_JWT_SECRET, KPAI_SANDBOX_DEEPSEEK_API_KEY
       └─ Logs:      /kidplayai/<stage>
  └─ RDS Postgres 16 (private, t4g.micro)
```

The `/var/kidplayai` mount + `TMPDIR=/var/kidplayai` env makes `os.tmpdir()` resolve to EFS, so sandbox folders persist across container restarts.

DB credentials are auto-generated into Secrets Manager. The container picks up `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` and the `docker-entrypoint.sh` composes `KPAI_DATABASE_URL` from them.

## Prereqs

- AWS account + credentials (`aws sts get-caller-identity` should work)
- Node 24, pnpm 10
- Docker with buildx (image is built `linux/amd64`)
- One-time per account/region: `pnpm bootstrap`

## First deploy

```bash
cd deploy
pnpm install
pnpm bootstrap                          # one-time CDK bootstrap
STAGE=prod ./scripts/deploy.sh          # provision infra + push image + redeploy service
```

Then populate the DeepSeek key (CDK creates an empty placeholder secret):

```bash
aws secretsmanager put-secret-value \
  --secret-id kidplayai/prod/deepseek \
  --secret-string '{"KPAI_SANDBOX_DEEPSEEK_API_KEY":"sk-..."}'
```

(or pass it as a plain string and update the stack to use `EcsSecret.fromSecretsManager(deepseekSecret)` without a JSON field — it already does, so a plain string works).

## With a custom domain

Set CDK context (or env vars) before deploying:

```bash
cdk deploy \
  -c domainName=kidplayai.techseeding.com.au \
  -c hostedZoneId=Z0123456789ABCDEF \
  -c hostedZoneName=techseeding.com.au
```

This switches the ALB to HTTPS, requests an ACM certificate (DNS-validated), and creates an A-record alias.

## Common commands

```bash
pnpm synth                    # render CloudFormation
pnpm diff                     # diff against deployed stack
pnpm deploy                   # cdk deploy --all
pnpm build-and-push           # rebuild image and push to ECR
pnpm migrate                  # run drizzle-kit migrate as a one-off ECS task
./scripts/deploy.sh           # all of the above end-to-end
```

Tail logs:

```bash
aws logs tail /kidplayai/prod --follow
```

## CI/CD

`.github/workflows/deploy.yml` runs on push to `main` (or manual dispatch). It assumes:

- GitHub OIDC trust to AWS — set `AWS_DEPLOY_ROLE_ARN` repo secret to a role that trusts `repo:<owner>/<repo>:ref:refs/heads/main`
- Optional repo *variables*: `AWS_REGION`, `KPAI_DOMAIN_NAME`, `KPAI_HOSTED_ZONE_ID`, `KPAI_HOSTED_ZONE_NAME`

## Notes / caveats

- **Single task by default.** WebSocket connections (terminal PTYs) are bound to the task that accepted them. Scaling beyond 1 needs sticky sessions or external state. Bump `desiredCount` in `lib/kidPlayAiStack.js` once you've solved that.
- **EFS performance.** Bursting throughput is fine for kid-scale traffic. Switch to `ThroughputMode.ELASTIC` if you see I/O backpressure.
- **Cost floor.** RDS t4g.micro + Fargate 1 vCPU/2GB + NAT gateway + ALB ≈ USD ~70–90/month idle.
- **Destroying.** `pnpm destroy` retains the ECR repo and (in prod) snapshots the DB. Drop `RemovalPolicy.RETAIN` in code before tearing down for good.
