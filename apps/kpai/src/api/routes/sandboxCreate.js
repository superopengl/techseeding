import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { verifyToken } from "../lib/verifyToken.js";
import { ensureSandboxWorkDir } from "../lib/sandboxManager.js";
import { success, error } from "../lib/response.js";

const SANDBOX_LIMIT_PER_USER = 10;

export function sandboxCreate(fastify) {
  fastify.post("/api/sandbox", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const { title } = request.body || {};
    if (typeof title === "string" && title.length > 50) {
      return error(reply, 400, "BAD_REQUEST", "Title must be 50 characters or less");
    }

    const [{ count }] = await db
      .select({ count: sql`count(*)::int` })
      .from(sandbox)
      .where(eq(sandbox.userId, payload.userId));
    if (count >= SANDBOX_LIMIT_PER_USER) {
      return error(
        reply,
        409,
        "SANDBOX_LIMIT_REACHED",
        `You can keep up to ${SANDBOX_LIMIT_PER_USER} crafts. Delete one to make room for a new one.`
      );
    }

    const id = crypto.randomUUID();
    const { workDir } = await ensureSandboxWorkDir(id);

    const [newSandbox] = await db
      .insert(sandbox)
      .values({
        id,
        userId: payload.userId,
        workDir,
        title: title || "Untitled Craft",
      })
      .returning();

    const { workDir: _, ...result } = newSandbox;
    return reply.status(201).send(success(result));
  });
}
