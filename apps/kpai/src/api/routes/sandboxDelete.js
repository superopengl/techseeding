import { db } from "../db/index.js";
import { sandbox, studentSession, sessionMessage, sandboxRelease } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import fs from "fs";

export function sandboxDelete(fastify) {
  fastify.delete("/api/sandbox/:id", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const [record] = await db
      .select({ id: sandbox.id, workDir: sandbox.workDir })
      .from(sandbox)
      .where(and(eq(sandbox.id, request.params.id), eq(sandbox.userId, payload.userId)));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }

    // Delete related records: sessionMessages -> studentSessions -> sandboxReleases -> sandbox
    const sessions = await db
      .select({ id: studentSession.id })
      .from(studentSession)
      .where(eq(studentSession.sandboxId, record.id));

    if (sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      await db.delete(sessionMessage).where(inArray(sessionMessage.sandboxSessionId, sessionIds));
      await db.delete(studentSession).where(inArray(studentSession.id, sessionIds));
    }

    await db.delete(sandboxRelease).where(eq(sandboxRelease.sandboxId, record.id));
    await db.delete(sandbox).where(eq(sandbox.id, record.id));

    // Clean up sandbox directory
    if (record.workDir && fs.existsSync(record.workDir)) {
      fs.rmSync(record.workDir, { recursive: true, force: true });
    }

    return success({ id: record.id });
  });
}
