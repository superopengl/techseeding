import { db } from "../db/index.js";
import { loginRequest, user } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { createJwtToken } from "../lib/createJwtToken.js";
import { success, error } from "../lib/response.js";
import { publishAdminEvent } from "../lib/adminEvents.js";

export function loginStatus(fastify) {
  fastify.get("/api/login/:loginRequestId/status", async (request, reply) => {
    const { loginRequestId } = request.params;

    const consumed = await db.execute(sql`
      WITH consumed AS (
        DELETE FROM ${loginRequest}
        WHERE ${loginRequest.id} = ${loginRequestId} AND ${loginRequest.status} = 'approved'
        RETURNING ${loginRequest.userId} AS user_id
      )
      SELECT ${user.id} AS id, ${user.role} AS role
      FROM consumed
      JOIN ${user} ON ${user.id} = consumed.user_id
    `);

    if (consumed.length > 0) {
      const { id: userId, role } = consumed[0];
      const token = createJwtToken({ userId, role });
      publishAdminEvent("login_request_changed", { loginRequestId, userId });
      return success({ loginRequestId, status: "approved", token, role });
    }

    const [record] = await db
      .select({ id: loginRequest.id, status: loginRequest.status })
      .from(loginRequest)
      .where(eq(loginRequest.id, loginRequestId));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Login request not found");
    }

    return success({ loginRequestId: record.id, status: record.status });
  });
}
