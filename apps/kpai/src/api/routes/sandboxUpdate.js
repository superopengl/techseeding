import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

export function sandboxUpdate(fastify) {
  fastify.patch("/api/sandbox/:id", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const { title } = request.body || {};
    if (title === undefined) {
      return error(reply, 400, "BAD_REQUEST", "Nothing to update");
    }
    if (typeof title === "string" && title.length > 50) {
      return error(reply, 400, "BAD_REQUEST", "Title must be 50 characters or less");
    }

    const [updated] = await db
      .update(sandbox)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(sandbox.id, request.params.id), eq(sandbox.userId, payload.userId)))
      .returning({
        id: sandbox.id,
        title: sandbox.title,
        updatedAt: sandbox.updatedAt,
      });

    if (!updated) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }

    return success(updated);
  });
}
