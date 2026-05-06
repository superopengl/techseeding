import { db } from "../db/index.js";
import { sandboxSession, sessionMessage } from "../db/schema.js";
import { eq, asc, desc, inArray } from "drizzle-orm";
import { success } from "../lib/response.js";

const DEFAULT_SESSION_LIMIT = 20;
const MAX_SESSION_LIMIT = 100;

export function adminSandboxMessages(fastify) {
  fastify.get("/api/admin/sandbox/:sandboxId/messages", async (request) => {
    const { sandboxId } = request.params;
    const limit = Math.min(
      MAX_SESSION_LIMIT,
      Math.max(1, Number(request.query?.limit) || DEFAULT_SESSION_LIMIT)
    );
    const offset = Math.max(0, Number(request.query?.offset) || 0);

    const sessions = await db
      .select({
        id: sandboxSession.id,
        createdAt: sandboxSession.createdAt,
        closedAt: sandboxSession.closedAt,
      })
      .from(sandboxSession)
      .where(eq(sandboxSession.sandboxId, sandboxId))
      .orderBy(desc(sandboxSession.createdAt))
      .limit(limit)
      .offset(offset);

    if (sessions.length === 0) {
      return success({ sessions: [], hasMore: false });
    }

    const sessionIds = sessions.map((s) => s.id);
    const messages = await db
      .select({
        id: sessionMessage.id,
        sessionId: sessionMessage.sandboxSessionId,
        type: sessionMessage.type,
        content: sessionMessage.content,
        createdAt: sessionMessage.createdAt,
      })
      .from(sessionMessage)
      .where(inArray(sessionMessage.sandboxSessionId, sessionIds))
      .orderBy(asc(sessionMessage.createdAt));

    const messagesBySession = new Map();
    for (const m of messages) {
      const arr = messagesBySession.get(m.sessionId) || [];
      arr.push({ id: m.id, type: m.type, content: m.content, createdAt: m.createdAt });
      messagesBySession.set(m.sessionId, arr);
    }

    const result = sessions
      .slice()
      .reverse()
      .map((s) => ({
        sessionId: s.id,
        createdAt: s.createdAt,
        closedAt: s.closedAt,
        messages: messagesBySession.get(s.id) || [],
      }));

    return success({ sessions: result, hasMore: sessions.length === limit });
  });
}
