import { db } from "../db/index.js";
import { sandboxSession, sessionMessage } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";
import { success } from "../lib/response.js";

export function adminSandboxMessages(fastify) {
  fastify.get("/api/admin/sandbox/:sandboxId/messages", async (request) => {
    const { sandboxId } = request.params;

    const rows = await db
      .select({
        sessionId: sandboxSession.id,
        sessionCreatedAt: sandboxSession.createdAt,
        sessionClosedAt: sandboxSession.closedAt,
        messageId: sessionMessage.id,
        messageType: sessionMessage.type,
        messageContent: sessionMessage.content,
        messageCreatedAt: sessionMessage.createdAt,
      })
      .from(sandboxSession)
      .leftJoin(sessionMessage, eq(sessionMessage.sandboxSessionId, sandboxSession.id))
      .where(eq(sandboxSession.sandboxId, sandboxId))
      .orderBy(asc(sandboxSession.createdAt), asc(sessionMessage.createdAt));

    const sessionMap = new Map();
    for (const row of rows) {
      let session = sessionMap.get(row.sessionId);
      if (!session) {
        session = {
          sessionId: row.sessionId,
          createdAt: row.sessionCreatedAt,
          closedAt: row.sessionClosedAt,
          messages: [],
        };
        sessionMap.set(row.sessionId, session);
      }
      if (row.messageId) {
        session.messages.push({
          id: row.messageId,
          type: row.messageType,
          content: row.messageContent,
          createdAt: row.messageCreatedAt,
        });
      }
    }

    return success(Array.from(sessionMap.values()));
  });
}
