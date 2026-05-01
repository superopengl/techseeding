import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { success } from "../lib/response.js";

export function adminStudentSandboxes(fastify) {
  fastify.get("/api/admin/students/:userId/sandboxes", async (request) => {
    const { userId } = request.params;

    const sandboxes = await db
      .select()
      .from(sandbox)
      .where(eq(sandbox.userId, userId))
      .orderBy(desc(sandbox.updatedAt));

    return success(sandboxes);
  });
}
