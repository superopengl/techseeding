import { db } from "../db/index.js";
import { sandbox, craftPlay as craftPlayTable } from "../db/schema.js";
import { eq, and, isNotNull } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { grantCoins } from "../lib/grantCoins.js";
import { canEarnCoinsAsViewer } from "../lib/canEarnCoins.js";
import { isUnderDailyCap } from "../lib/checkDailyCap.js";
import { computeReward } from "../lib/coinRules.js";

export function craftPlay(fastify) {
  fastify.post("/api/craft/:id/play", async (request, reply) => {
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

    // Insert; the unique index on (sandbox_id, viewer_user_id) makes
    // repeat plays a no-op. Wrap in try/catch so the conflict path is
    // silent — the response stays idempotent.
    let firstPlay = false;
    try {
      await db.insert(craftPlayTable).values({
        sandboxId: craft.id,
        viewerUserId: payload.userId,
      });
      firstPlay = true;
    } catch (err) {
      if (err?.code !== "23505") throw err;
    }

    let grant = null;
    if (firstPlay && craft.ownerUserId !== payload.userId) {
      const eligible = await canEarnCoinsAsViewer(payload.userId);
      const under = await isUnderDailyCap(craft.id, "play");
      if (eligible && under) {
        const reward = computeReward("play", craft.publishBountyPaidAt || craft.publishedAt);
        const row = await grantCoins({
          userId: craft.ownerUserId,
          delta: reward,
          reason: "play",
          sandboxId: craft.id,
          relatedUserId: payload.userId,
          idempotencyKey: `play:${craft.id}:${payload.userId}`,
        });
        if (row) grant = { reason: "play", delta: row.delta, userId: craft.ownerUserId };
      }
    }

    return success({ sandboxId: craft.id, firstPlay, grant });
  });
}
