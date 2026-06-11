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
          inputTokens: sum(sessionMessage.inputTokens).mapWith(Number).as("input_tokens"),
          outputTokens: sum(sessionMessage.outputTokens).mapWith(Number).as("output_tokens"),
          reasoningTokens: sum(sessionMessage.reasoningTokens).mapWith(Number).as("reasoning_tokens"),
          cacheReadTokens: sum(sessionMessage.cacheReadTokens).mapWith(Number).as("cache_read_tokens"),
          cacheWriteTokens: sum(sessionMessage.cacheWriteTokens).mapWith(Number).as("cache_write_tokens"),
          cost: sum(sessionMessage.cost).mapWith(Number).as("cost"),
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
