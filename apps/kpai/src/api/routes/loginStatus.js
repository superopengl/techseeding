import { db } from "../db/index.js";
import { studentSession } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function loginStatus(fastify) {
  fastify.get("/api/login/status/:sessionId", async (request, reply) => {
    const { sessionId } = request.params;
    const [session] = await db
      .select()
      .from(studentSession)
      .where(eq(studentSession.id, sessionId));

    if (!session) {
      return reply.status(404).send({ error: "Session not found" });
    }

    return { status: session.status, sessionId: session.id };
  });
}
