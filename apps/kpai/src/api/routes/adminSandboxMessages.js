import { db } from "../db/index.js";
import { sandboxSession, sessionMessage } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";
import { success } from "../lib/response.js";

export function adminSandboxMessages(fastify) {
  fastify.get("/api/admin/sandbox/:sandboxId/messages", async (request) => {
    const { sandboxId } = request.params;

    const sessions = await db
      .select()
      .from(sandboxSession)
      .where(eq(sandboxSession.sandboxId, sandboxId))
      .orderBy(asc(sandboxSession.createdAt));

    const result = [];
    for (const session of sessions) {
      const messages = await db
        .select()
        .from(sessionMessage)
        .where(eq(sessionMessage.sandboxSessionId, session.id))
        .orderBy(asc(sessionMessage.createdAt));

      result.push({
        sessionId: session.id,
        createdAt: session.createdAt,
        closedAt: session.closedAt,
        messages,
      });
    }

    return success(result);
  });
}
