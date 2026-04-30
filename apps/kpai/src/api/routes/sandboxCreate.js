import crypto from "crypto";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { verifyToken } from "../lib/verifyToken.js";
import { createSandbox } from "../lib/sandboxManager.js";
import { success, error } from "../lib/response.js";

export function sandboxCreate(fastify) {
  fastify.post("/api/sandbox", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const { title } = request.body || {};
    const id = crypto.randomUUID();
    const releaseUrl = `${process.env.LAB67_API_SERVICE_URL}/sandbox/${id}/preview`;
    const workDir = createSandbox(id);

    const [newSandbox] = await db
      .insert(sandbox)
      .values({
        id,
        userId: payload.userId,
        releaseUrl,
        workDir,
        title: title || "Untitled Game",
      })
      .returning();

    return reply.status(201).send(success(newSandbox));
  });
}
