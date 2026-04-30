import { db } from "../db/index.js";
import { studentSession } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminApprove(fastify) {
  fastify.post("/api/admin/approve/:sessionId", async (request, reply) => {
    const { sessionId } = request.params;
    const [session] = await db
      .update(studentSession)
      .set({ status: "active", loggedInAt: new Date(), updatedAt: new Date() })
      .where(eq(studentSession.id, sessionId))
      .returning();

    if (!session) {
      return error(reply, 404, "NOT_FOUND", "Session not found");
    }

    return success({ status: session.status });
  });
}
