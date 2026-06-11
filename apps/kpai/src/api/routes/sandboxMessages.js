import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage } from "../db/schema.js";
import { eq, and, asc, inArray } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

const MAX_MESSAGES = 500;

export function sandboxMessages(fastify) {
  fastify.get("/api/sandbox/:id/messages", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const [owned] = await db
      .select({ id: sandbox.id })
      .from(sandbox)
      .where(and(eq(sandbox.id, request.params.id), eq(sandbox.userId, payload.userId)));
    if (!owned) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }

    const sessions = await db
      .select({ id: sandboxSession.id })
      .from(sandboxSession)
      .where(eq(sandboxSession.sandboxId, request.params.id));
    if (sessions.length === 0) {
      return success({ messages: [] });
    }

    const messages = await db
      .select({
        id: sessionMessage.id,
        opencodeMessageId: sessionMessage.opencodeMessageId,
        type: sessionMessage.type,
        content: sessionMessage.content,
        createdAt: sessionMessage.createdAt,
      })
      .from(sessionMessage)
      .where(inArray(sessionMessage.sandboxSessionId, sessions.map((s) => s.id)))
      .orderBy(asc(sessionMessage.createdAt))
      .limit(MAX_MESSAGES);

    return success({
      messages: messages.map((m) => ({
        id: m.opencodeMessageId || m.id,
        role: m.type,
        text: m.content?.text || "",
        // Parts populated for messages persisted by the new wsChat path; older
        // rows have only `text` and the client falls back to a single text part.
        parts: Array.isArray(m.content?.parts) ? m.content.parts : [],
        createdAt: m.createdAt,
      })),
    });
  });
}
