import { db } from "../db/index.js";
import { user, sandbox } from "../db/schema.js";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { ELIGIBLE_VIEWER_MIN_AGE_MS } from "./coinRules.js";

// A viewer's engagement actions only pay coins to creators when the
// viewer is itself an established account. Two conditions:
//   1. account is older than 24h
//   2. has at least one published craft of their own
//
// This kills sock-puppet farms cheaply: a brand-new account can play,
// like, and fork freely — it just doesn't move coins to anyone yet.
export async function canEarnCoinsAsViewer(viewerUserId) {
  if (!viewerUserId) return false;

  const [u] = await db
    .select({ createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, viewerUserId))
    .limit(1);
  if (!u) return false;
  const ageMs = Date.now() - new Date(u.createdAt).getTime();
  if (ageMs < ELIGIBLE_VIEWER_MIN_AGE_MS) return false;

  const [published] = await db
    .select({ count: sql`count(*)::int` })
    .from(sandbox)
    .where(and(eq(sandbox.userId, viewerUserId), isNotNull(sandbox.publishedAt)));
  return (published?.count ?? 0) > 0;
}
