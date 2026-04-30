import { db } from "../db/index.js";
import { loginRequest } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function adminLoginApprove(fastify) {
  fastify.post("/api/admin/login/student/approve", async (request, reply) => {
    const { loginRequestId } = request.body || {};
    if (!loginRequestId) {
      return reply.status(400).send({ error: "loginRequestId is required" });
    }

    const [record] = await db
      .update(loginRequest)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(loginRequest.id, loginRequestId))
      .returning();

    if (!record) {
      return reply.status(404).send({ error: "Login request not found" });
    }

    return { loginRequestId: record.id, status: record.status };
  });
}
