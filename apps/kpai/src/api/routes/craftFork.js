import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { forkCraft } from "../lib/forkCraft.js";

export function craftFork(fastify) {
  fastify.post("/api/craft/:id/fork", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    try {
      const { sandbox: newSandbox, grant } = await forkCraft({
        userId: payload.userId,
        sourceSandboxId: request.params.id,
      });
      const { workDir: _, ...result } = newSandbox;
      return reply.status(201).send(success({ sandbox: result, grant }));
    } catch (err) {
      if (err.code === "NOT_FOUND") {
        return error(reply, 404, "NOT_FOUND", err.message);
      }
      if (err.code === "SANDBOX_LIMIT_REACHED") {
        return error(reply, 409, "SANDBOX_LIMIT_REACHED", err.message);
      }
      throw err;
    }
  });
}
