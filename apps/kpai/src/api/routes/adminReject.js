import { db } from "../db/index.js";
import { studentSession } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function adminReject(fastify) {
  fastify.post("/api/admin/reject/:sessionId", async (request, reply) => {
    const { sessionId } = request.params;

    const [deleted] = await db
      .delete(studentSession)
      .where(eq(studentSession.id, sessionId))
      .returning();

    if (!deleted) {
      return reply.status(404).send({ error: "Session not found" });
    }

    return { status: "rejected" };
  });
}
