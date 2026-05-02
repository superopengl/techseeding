import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage } from "../db/schema.js";
import { eq, desc, sum, and, sql } from "drizzle-orm";
import { success } from "../lib/response.js";

export function adminStudentSandboxes(fastify) {
  fastify.get("/api/admin/students/:userId/sandboxes", async (request) => {
    const { userId } = request.params;

    const sandboxes = await db
      .select({
        id: sandbox.id,
        userId: sandbox.userId,
        workDir: sandbox.workDir,
        title: sandbox.title,
        description: sandbox.description,
        createdAt: sandbox.createdAt,
        updatedAt: sandbox.updatedAt,
        totalRequestLength: sum(
          sql`CASE WHEN ${sessionMessage.type} = 'request' THEN ${sessionMessage.contentLength} ELSE 0 END`
        ).as("total_request_length"),
        totalResponseLength: sum(
          sql`CASE WHEN ${sessionMessage.type} = 'response' THEN ${sessionMessage.contentLength} ELSE 0 END`
        ).as("total_response_length"),
      })
      .from(sandbox)
      .leftJoin(sandboxSession, eq(sandboxSession.sandboxId, sandbox.id))
      .leftJoin(sessionMessage, eq(sessionMessage.sandboxSessionId, sandboxSession.id))
      .where(eq(sandbox.userId, userId))
      .groupBy(sandbox.id)
      .orderBy(desc(sandbox.updatedAt));

    return success(sandboxes);
  });
}
