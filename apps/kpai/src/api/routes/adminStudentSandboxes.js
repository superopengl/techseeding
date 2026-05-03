import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage } from "../db/schema.js";
import { eq, desc, sum, sql } from "drizzle-orm";
import { success } from "../lib/response.js";
import { parsePagination } from "../lib/parsePagination.js";

export function adminStudentSandboxes(fastify) {
  fastify.get("/api/admin/students/:userId/sandboxes", async (request) => {
    const { userId } = request.params;
    const { page, pageSize, limit, offset } = parsePagination(request.query);

    const [sandboxes, [{ count: total }]] = await Promise.all([
      db
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
        .orderBy(desc(sandbox.updatedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql`count(*)::int` })
        .from(sandbox)
        .where(eq(sandbox.userId, userId)),
    ]);

    return success(sandboxes, { total, page, pageSize });
  });
}
