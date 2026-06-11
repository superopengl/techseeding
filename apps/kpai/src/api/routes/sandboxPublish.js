import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { publishCraft } from "../lib/publishCraft.js";

export function sandboxPublish(fastify) {
  fastify.post("/api/sandbox/:id/publish", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    try {
      const result = await publishCraft({ userId: payload.userId, sandboxId: request.params.id });
      return success(result);
    } catch (err) {
      if (err.code === "NOT_FOUND") {
        return error(reply, 404, "NOT_FOUND", "Sandbox not found");
      }
      throw err;
    }
  });
}
