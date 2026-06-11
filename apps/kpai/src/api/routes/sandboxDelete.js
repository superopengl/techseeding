import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage, sandboxRelease } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import fs from "fs/promises";

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

    // Delete related records: sessionMessages -> sandboxSessions -> sandboxReleases -> sandbox
    await db.transaction(async (tx) => {
      const sessions = await tx
        .select({ id: sandboxSession.id })
        .from(sandboxSession)
        .where(eq(sandboxSession.sandboxId, record.id));

      if (sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        await tx.delete(sessionMessage).where(inArray(sessionMessage.sandboxSessionId, sessionIds));
        await tx.delete(sandboxSession).where(inArray(sandboxSession.id, sessionIds));
      }

      await tx.delete(sandboxRelease).where(eq(sandboxRelease.sandboxId, record.id));
      await tx.delete(sandbox).where(eq(sandbox.id, record.id));
    });

    // Clean up sandbox directory in the background — don't block the response
    if (record.workDir) {
      fs.rm(record.workDir, { recursive: true, force: true }).catch((err) => {
        fastify.log.error({ err, workDir: record.workDir }, "failed to remove sandbox dir");
      });
    }

    return success({ id: record.id });
  });
}
