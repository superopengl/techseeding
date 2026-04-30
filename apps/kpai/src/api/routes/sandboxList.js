import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

export function sandboxList(fastify) {
  fastify.get("/api/sandbox", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const sandboxes = await db
      .select()
      .from(sandbox)
      .where(eq(sandbox.userId, payload.userId))
      .orderBy(desc(sandbox.updatedAt));

    return success(sandboxes);
  });
}
