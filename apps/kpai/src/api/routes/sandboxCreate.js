import crypto from "crypto";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { verifyToken } from "../lib/verifyToken.js";
import { provisionSandboxDirectory } from "../lib/sandboxManager.js";
import { success, error } from "../lib/response.js";

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
    const id = crypto.randomUUID();
    const workDir = provisionSandboxDirectory(id);

    const [newSandbox] = await db
      .insert(sandbox)
      .values({
        id,
        userId: payload.userId,
        workDir,
        title: title || "Untitled Game",
      })
      .returning();

    const { workDir: _, ...result } = newSandbox;
    return reply.status(201).send(success(result));
  });
}
