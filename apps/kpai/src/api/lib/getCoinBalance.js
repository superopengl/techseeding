import { db } from "../db/index.js";
import { coinLedger } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

// Returns the user's current coin balance as an integer. Computed as
// sum(delta) over all ledger entries; an empty ledger returns 0.
export async function getCoinBalance(userId) {
  const [row] = await db
    .select({ balance: sql`coalesce(sum(${coinLedger.delta}), 0)::int` })
    .from(coinLedger)
    .where(eq(coinLedger.userId, userId));
  return row?.balance ?? 0;
}
