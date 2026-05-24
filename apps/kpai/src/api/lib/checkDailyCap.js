import { db } from "../db/index.js";
import { coinLedger } from "../db/schema.js";
import { eq, and, gt, gte, sql } from "drizzle-orm";
import { DAILY_CAPS_PER_CRAFT } from "./coinRules.js";

// Returns true if the per-craft daily cap for this reason is still
// open (i.e., paying the next reward is allowed). Returns false if
// the cap has been hit — the engagement row should still be recorded,
// but the coin grant must be skipped.
export async function isUnderDailyCap(sandboxId, reason) {
  const cap = DAILY_CAPS_PER_CRAFT[reason];
  if (cap == null) return true; // no cap defined for this reason

  const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
  const [row] = await db
    .select({ count: sql`count(*)::int` })
    .from(coinLedger)
    .where(
      and(
        eq(coinLedger.sandboxId, sandboxId),
        eq(coinLedger.reason, reason),
        gt(coinLedger.delta, 0),
        gte(coinLedger.createdAt, new Date(sinceMs)),
      ),
    );
  return (row?.count ?? 0) < cap;
}
