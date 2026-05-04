import { db } from "../db/index.js";
import { loginRequest, user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { createJwtToken } from "../lib/createJwtToken.js";
import { success, error } from "../lib/response.js";

export function loginStatus(fastify) {
  fastify.get("/api/login/:loginRequestId/status", async (request, reply) => {
    const { loginRequestId } = request.params;

    const [record] = await db
      .select()
      .from(loginRequest)
      .innerJoin(user, eq(user.id, loginRequest.userId))
      .where(eq(loginRequest.id, loginRequestId));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Login request not found");
    }

    const { login_request: req, user } = record;

    if (req.status === "approved") {
      const token = createJwtToken({ userId: user.id, role: user.role });
      return success({ loginRequestId: req.id, status: req.status, token, role: user.role });
    }

    return success({ loginRequestId: req.id, status: req.status });
  });
}
