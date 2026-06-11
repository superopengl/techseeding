import { clearAuthCookies } from "../lib/clearAuthCookies.js";
import { success } from "../lib/response.js";

export function logout(fastify) {
  fastify.post("/api/logout", async (request, reply) => {
    clearAuthCookies(reply);
    return success({ ok: true });
  });
}
