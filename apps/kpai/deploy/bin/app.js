#!/usr/bin/env node
import { App, Tags } from "aws-cdk-lib";
import { KidPlayAiStack } from "../lib/kidPlayAiStack.js";

const app = new App();

const stage = app.node.tryGetContext("stage") ?? "prod";
const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "ap-southeast-2";
const domainName = app.node.tryGetContext("domainName") ?? process.env.KPAI_DOMAIN_NAME;
const hostedZoneId = app.node.tryGetContext("hostedZoneId") ?? process.env.KPAI_HOSTED_ZONE_ID;
const hostedZoneName = app.node.tryGetContext("hostedZoneName") ?? process.env.KPAI_HOSTED_ZONE_NAME;

new KidPlayAiStack(app, `KidPlayAi-${stage}`, {
  env: { account, region },
  stage,
  domainName,
  hostedZoneId,
  hostedZoneName,
});

Tags.of(app).add("Project", "KidPlayAI");
Tags.of(app).add("Stage", stage);
