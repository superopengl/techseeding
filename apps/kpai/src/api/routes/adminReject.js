import { db } from "../db/index.js";
import { sandboxSession } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminReject(fastify) {
  fastify.post("/api/admin/reject/:sessionId", async (request, reply) => {
    const { sessionId } = request.params;

    const [deleted] = await db
      .delete(sandboxSession)
      .where(eq(sandboxSession.id, sessionId))
      .returning();

    if (!deleted) {
      return error(reply, 404, "NOT_FOUND", "Session not found");
    }

    return success({ status: "rejected" });
  });
}
