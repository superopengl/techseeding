import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { isValidUserName } from "../lib/isValidUserName.js";

export function adminCheckUserName(fastify) {
  fastify.post("/api/admin/check-user-name", async (request, reply) => {
    const { userName } = request.body || {};

    if (!userName) {
      return error(reply, 400, "VALIDATION_ERROR", "userName is required");
    }
    if (!isValidUserName(userName)) {
      return error(reply, 400, "VALIDATION_ERROR", "userName may only contain letters, digits, underscore, and slash");
    }

    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(sql`lower(${user.userName}) = lower(${userName})`)
      .limit(1);

    return success({ available: !existing });
  });
}
