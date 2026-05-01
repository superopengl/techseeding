import { db } from "../db/index.js";
import { sandboxSession } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function loginStatus(fastify) {
  fastify.get("/api/login/status/:sessionId", async (request, reply) => {
    const { sessionId } = request.params;
    const [session] = await db
      .select()
      .from(sandboxSession)
      .where(eq(sandboxSession.id, sessionId));

    if (!session) {
      return error(reply, 404, "NOT_FOUND", "Session not found");
    }

    return success({ status: session.status, sessionId: session.id });
  });
}
