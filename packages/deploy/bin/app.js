#!/usr/bin/env node
// CDK app dispatcher. Selects which stack to synth/deploy based on CDK_APP.
// Release scripts set this; root pnpm shortcuts (`pnpm cdk:kpai`, `pnpm cdk:ytai`)
// set it too.
const which = process.env.CDK_APP;
if (which === "kpai") {
  await import("./kpai.js");
} else if (which === "ytai") {
  await import("./ytai.js");
} else {
  // eslint-disable-next-line no-console
  console.error(
    `CDK_APP must be 'kpai' or 'ytai' (got: ${which ?? "<unset>"}).\n` +
      `Set it before invoking cdk, e.g. CDK_APP=kpai pnpm exec cdk synth.`,
  );
  process.exit(1);
}
