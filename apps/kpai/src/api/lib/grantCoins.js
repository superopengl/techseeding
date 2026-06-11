import { db } from "../db/index.js";
import { coinLedger } from "../db/schema.js";

// Insert a row into coin_ledger. When idempotencyKey is provided, a
// duplicate insert is silently swallowed (returns null) so callers can
// retry safely. Without an idempotencyKey, every call inserts.
//
// Pass a `tx` (Drizzle transaction) to enroll the insert in an outer
// atomic operation — required when the grant must succeed or fail
// together with a state change (publishing, forking, etc.).
export async function grantCoins({
  userId,
  delta,
  reason,
  sandboxId = null,
  relatedUserId = null,
  idempotencyKey = null,
  metadata = null,
  tx = null,
}) {
  if (!userId) throw new Error("grantCoins: userId is required");
  if (!Number.isInteger(delta)) throw new Error("grantCoins: delta must be an integer");
  if (!reason) throw new Error("grantCoins: reason is required");
  if (delta === 0) return null;

  const exec = tx || db;
  try {
    const [row] = await exec
      .insert(coinLedger)
      .values({ userId, delta, reason, sandboxId, relatedUserId, idempotencyKey, metadata })
      .returning();
    return row;
  } catch (err) {
    // 23505 = unique_violation. Idempotency key collision is the
    // expected path — return null so the caller can keep going.
    if (err && err.code === "23505") return null;
    throw err;
  }
}
