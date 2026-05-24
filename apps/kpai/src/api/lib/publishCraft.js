import { db } from "../db/index.js";
import { sandbox, coinLedger } from "../db/schema.js";
import { eq, and, gt, gte, sql } from "drizzle-orm";
import { grantCoins } from "./grantCoins.js";
import {
  COIN_REWARDS,
  DESCENDANT_PUBLISH_REWARDS,
  DESCENDANT_PUBLISH_MAX_DEPTH,
  WEEKLY_PUBLISH_BOUNTY_CAP_PER_USER,
} from "./coinRules.js";

// Orchestrates the publish flow for a craft. Idempotent: republishing
// a craft is a no-op for coins, but still flips publishedAt back on.
//
// Returns { sandboxId, publishedAt, grants: [{ reason, delta, userId }] }
// where grants enumerates the coin movements this call produced.
export async function publishCraft({ userId, sandboxId }) {
  return db.transaction(async (tx) => {
    const [craft] = await tx
      .select()
      .from(sandbox)
      .where(and(eq(sandbox.id, sandboxId), eq(sandbox.userId, userId)))
      .limit(1);
    if (!craft) throw Object.assign(new Error("Sandbox not found"), { code: "NOT_FOUND" });

    const now = new Date();
    const grants = [];

    // Flip public state. Re-publishing a previously-unpublished craft
    // just re-sets published_at; bounty checks below short-circuit on
    // publish_bounty_paid_at so coins aren't paid twice.
    if (!craft.publishedAt) {
      await tx.update(sandbox).set({ publishedAt: now, updatedAt: now }).where(eq(sandbox.id, sandboxId));
    }

    // First-ever publish on the account.
    if (!craft.publishBountyPaidAt) {
      const firstRow = await grantCoins({
        userId,
        delta: COIN_REWARDS.first_publish,
        reason: "first_publish",
        sandboxId,
        idempotencyKey: `first_publish:${userId}`,
        tx,
      });
      if (firstRow) grants.push({ reason: "first_publish", delta: firstRow.delta, userId });

      // Per-craft publish bounty, subject to the weekly cap on bounty
      // payouts (not on publishes themselves).
      const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const [bountyRow] = await tx
        .select({ count: sql`count(*)::int` })
        .from(coinLedger)
        .where(
          and(
            eq(coinLedger.userId, userId),
            eq(coinLedger.reason, "publish"),
            gt(coinLedger.delta, 0),
            gte(coinLedger.createdAt, new Date(sinceMs)),
          ),
        );
      if ((bountyRow?.count ?? 0) < WEEKLY_PUBLISH_BOUNTY_CAP_PER_USER) {
        const row = await grantCoins({
          userId,
          delta: COIN_REWARDS.publish,
          reason: "publish",
          sandboxId,
          idempotencyKey: `publish:${sandboxId}`,
          tx,
        });
        if (row) grants.push({ reason: "publish", delta: row.delta, userId });
      }

      // Mark this craft as having received its first-publish processing
      // so unpublish→republish doesn't pay the bounty again.
      await tx.update(sandbox).set({ publishBountyPaidAt: now }).where(eq(sandbox.id, sandboxId));
    }

    // Walk the fork chain. Each ancestor up to depth 3 earns a fixed
    // descendant-publish bonus, paid once per (descendant, ancestor)
    // pair. Self-grants are skipped.
    let cursorId = craft.forkedFromSandboxId;
    for (let depth = 1; depth <= DESCENDANT_PUBLISH_MAX_DEPTH; depth++) {
      if (!cursorId) break;
      const [ancestor] = await tx
        .select({ id: sandbox.id, userId: sandbox.userId, forkedFromSandboxId: sandbox.forkedFromSandboxId })
        .from(sandbox)
        .where(eq(sandbox.id, cursorId))
        .limit(1);
      if (!ancestor) break;

      if (ancestor.userId !== userId) {
        const reward = DESCENDANT_PUBLISH_REWARDS[depth];
        const row = await grantCoins({
          userId: ancestor.userId,
          delta: reward,
          reason: "descendant_publish",
          sandboxId: ancestor.id,
          relatedUserId: userId,
          idempotencyKey: `descendant_publish:${sandboxId}:${ancestor.id}`,
          metadata: { depth },
          tx,
        });
        if (row) grants.push({ reason: "descendant_publish", delta: row.delta, userId: ancestor.userId, depth });
      }

      cursorId = ancestor.forkedFromSandboxId;
    }

    return { sandboxId, publishedAt: craft.publishedAt || now, grants };
  });
}
