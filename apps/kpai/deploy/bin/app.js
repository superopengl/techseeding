#!/usr/bin/env node
import { App, Tags } from "aws-cdk-lib";
import { KidPlayAiStack } from "../lib/kpaiStack.js";
import { KidPlayAiCdnCertStack } from "../lib/kpaiCdnCertStack.js";

const app = new App();

const stage = app.node.tryGetContext("stage") ?? "prod";
const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "ap-southeast-2";
const domainName =
  app.node.tryGetContext("domainName") ??
  process.env.KPAI_DOMAIN_NAME ??
  "kidplayai.techseeding.com.au";
const hostedZoneName =
  app.node.tryGetContext("hostedZoneName") ??
  process.env.KPAI_HOSTED_ZONE_NAME ??
  "techseeding.com.au";
const imageTag =
  app.node.tryGetContext("imageTag") ?? process.env.IMAGE_TAG ?? "latest";
const appRepoName =
  app.node.tryGetContext("appRepoName") ?? process.env.APP_REPO_NAME ?? "kpai";

// CloudFront requires its ACM cert in us-east-1. Place it in a sibling stack
// and consume the Certificate via cross-region references.
const cdnCertStack = new KidPlayAiCdnCertStack(app, `kpai-${stage}-cdn-cert`, {
  env: { account, region: "us-east-1" },
  crossRegionReferences: true,
  domainName,
  hostedZoneName,
});

const appStack = new KidPlayAiStack(app, `kpai-${stage}`, {
  env: { account, region },
  crossRegionReferences: true,
  stage,
  domainName,
  hostedZoneName,
  appRepoName,
  imageTag,
  cdnCertificate: cdnCertStack.certificate,
});
appStack.addDependency(cdnCertStack);

Tags.of(app).add("Project", "kpai");
Tags.of(app).add("Stage", stage);
