import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { parsePagination } from "../lib/parsePagination.js";

export function sandboxList(fastify) {
  fastify.get("/api/sandbox", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const { page, pageSize, limit, offset } = parsePagination(request.query);

    const [sandboxes, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(sandbox)
        .where(eq(sandbox.userId, payload.userId))
        .orderBy(desc(sandbox.updatedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql`count(*)::int` })
        .from(sandbox)
        .where(eq(sandbox.userId, payload.userId)),
    ]);

    return success(sandboxes, { total, page, pageSize });
  });
}
