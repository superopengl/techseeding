import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

export function sandboxGet(fastify) {
  fastify.get("/api/sandbox/:id", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const [record] = await db
      .select({
        id: sandbox.id,
        title: sandbox.title,
        description: sandbox.description,
        createdAt: sandbox.createdAt,
        updatedAt: sandbox.updatedAt,
      })
      .from(sandbox)
      .where(and(eq(sandbox.id, request.params.id), eq(sandbox.userId, payload.userId)));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }

    return success(record);
  });
}
