import { db } from "../db/index.js";
import { sandbox, craftLike as craftLikeTable } from "../db/schema.js";
import { eq, and, isNotNull } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { grantCoins } from "../lib/grantCoins.js";
import { canEarnCoinsAsViewer } from "../lib/canEarnCoins.js";
import { isUnderDailyCap } from "../lib/checkDailyCap.js";
import { computeReward } from "../lib/coinRules.js";

// POST /api/craft/:id/like — toggles like state. First-time like grants
// the bounty (subject to eligibility + daily cap); unliking removes the
// row but does not refund. The coin grant is keyed idempotently on
// (sandbox, viewer) so an unlike → relike cycle still pays only once
// per viewer per craft.
export function craftLike(fastify) {
  fastify.post("/api/craft/:id/like", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const [craft] = await db
      .select({
        id: sandbox.id,
        ownerUserId: sandbox.userId,
        publishedAt: sandbox.publishedAt,
        publishBountyPaidAt: sandbox.publishBountyPaidAt,
      })
      .from(sandbox)
      .where(and(eq(sandbox.id, request.params.id), isNotNull(sandbox.publishedAt)))
      .limit(1);
    if (!craft) {
      return error(reply, 404, "NOT_FOUND", "Craft not found");
    }

    const [existing] = await db
      .select({ id: craftLikeTable.id })
      .from(craftLikeTable)
      .where(and(eq(craftLikeTable.sandboxId, craft.id), eq(craftLikeTable.viewerUserId, payload.userId)))
      .limit(1);

    if (existing) {
      await db.delete(craftLikeTable).where(eq(craftLikeTable.id, existing.id));
      return success({ sandboxId: craft.id, liked: false, grant: null });
    }

    await db.insert(craftLikeTable).values({
      sandboxId: craft.id,
      viewerUserId: payload.userId,
    });

    let grant = null;
    if (craft.ownerUserId !== payload.userId) {
      const eligible = await canEarnCoinsAsViewer(payload.userId);
      const under = await isUnderDailyCap(craft.id, "like");
      if (eligible && under) {
        const reward = computeReward("like", craft.publishBountyPaidAt || craft.publishedAt);
        const row = await grantCoins({
          userId: craft.ownerUserId,
          delta: reward,
          reason: "like",
          sandboxId: craft.id,
          relatedUserId: payload.userId,
          idempotencyKey: `like:${craft.id}:${payload.userId}`,
        });
        if (row) grant = { reason: "like", delta: row.delta, userId: craft.ownerUserId };
      }
    }

    return success({ sandboxId: craft.id, liked: true, grant });
  });
}
