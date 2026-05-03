import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminCheckUserName(fastify) {
  fastify.post("/api/admin/check-user-name", async (request, reply) => {
    const { userName } = request.body || {};

    if (!userName) {
      return error(reply, 400, "VALIDATION_ERROR", "userName is required");
    }

    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.userName, userName))
      .limit(1);

    return success({ available: !existing });
  });
}
