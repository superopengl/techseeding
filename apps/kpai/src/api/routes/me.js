import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

export function me(fastify) {
  fastify.get("/api/me", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const [record] = await db
      .select({ displayName: user.displayName, role: user.role })
      .from(user)
      .where(eq(user.id, payload.userId));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "User not found");
    }

    return success(record);
  });
}
