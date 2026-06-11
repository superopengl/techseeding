import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

export function sandboxUnpublish(fastify) {
  fastify.post("/api/sandbox/:id/unpublish", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const [updated] = await db
      .update(sandbox)
      .set({ publishedAt: null, updatedAt: new Date() })
      .where(and(eq(sandbox.id, request.params.id), eq(sandbox.userId, payload.userId)))
      .returning({ id: sandbox.id, publishedAt: sandbox.publishedAt });

    if (!updated) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }
    return success(updated);
  });
}
