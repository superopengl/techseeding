import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq, sql, isNotNull, and } from "drizzle-orm";
import { ensureSandboxWorkDir } from "./sandboxManager.js";
import { grantCoins } from "./grantCoins.js";
import { canEarnCoinsAsViewer } from "./canEarnCoins.js";
import { isUnderDailyCap } from "./checkDailyCap.js";
import { computeReward } from "./coinRules.js";

const SANDBOX_LIMIT_PER_USER = 10;

// Forks a published craft into a new sandbox owned by `userId`. Copies
// the source's index.html (DB column + on-disk workDir). Pays the fork
// bounty to the source owner if the forker is eligible, not self-forking,
// and the daily cap is open. Returns the new sandbox row.
export async function forkCraft({ userId, sourceSandboxId }) {
  const [source] = await db
    .select()
    .from(sandbox)
    .where(and(eq(sandbox.id, sourceSandboxId), isNotNull(sandbox.publishedAt)))
    .limit(1);
  if (!source) throw Object.assign(new Error("Source craft not found or not published"), { code: "NOT_FOUND" });

  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(sandbox)
    .where(eq(sandbox.userId, userId));
  if (count >= SANDBOX_LIMIT_PER_USER) {
    throw Object.assign(
      new Error(`You can keep up to ${SANDBOX_LIMIT_PER_USER} crafts. Delete one before forking another.`),
      { code: "SANDBOX_LIMIT_REACHED" },
    );
  }

  // Create new sandbox row and workDir; copy index.html from source.
  const newId = crypto.randomUUID();
  const { workDir } = await ensureSandboxWorkDir(newId);

  if (source.indexHtmlContent != null) {
    await fs.writeFile(path.join(workDir, "index.html"), source.indexHtmlContent, "utf8");
  }

  const title = source.title ? `${source.title} (fork)` : "Forked Craft";
  const [newSandbox] = await db
    .insert(sandbox)
    .values({
      id: newId,
      userId,
      workDir,
      title,
      description: source.description,
      indexHtmlContent: source.indexHtmlContent,
      forkedFromSandboxId: source.id,
    })
    .returning();

  // Pay fork bounty to the source owner. Skipped on self-fork, on
  // ineligible forkers, or when the daily cap is closed. Idempotent
  // on (source, forker) so a retried request can't double-pay.
  let grant = null;
  if (source.userId !== userId) {
    const eligible = await canEarnCoinsAsViewer(userId);
    const under = await isUnderDailyCap(source.id, "fork");
    if (eligible && under) {
      const reward = computeReward("fork", source.publishBountyPaidAt || source.publishedAt);
      const row = await grantCoins({
        userId: source.userId,
        delta: reward,
        reason: "fork",
        sandboxId: source.id,
        relatedUserId: userId,
        idempotencyKey: `fork:${source.id}:${userId}`,
      });
      if (row) grant = { reason: "fork", delta: row.delta, userId: source.userId };
    }
  }

  return { sandbox: newSandbox, grant };
}
