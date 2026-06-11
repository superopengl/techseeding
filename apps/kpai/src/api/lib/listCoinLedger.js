import { db } from "../db/index.js";
import { coinLedger } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

// Returns the most-recent ledger entries for a user, newest first.
export async function listCoinLedger(userId, limit = 50) {
  return db
    .select({
      id: coinLedger.id,
      delta: coinLedger.delta,
      reason: coinLedger.reason,
      sandboxId: coinLedger.sandboxId,
      relatedUserId: coinLedger.relatedUserId,
      metadata: coinLedger.metadata,
      createdAt: coinLedger.createdAt,
    })
    .from(coinLedger)
    .where(eq(coinLedger.userId, userId))
    .orderBy(desc(coinLedger.createdAt))
    .limit(limit);
}
