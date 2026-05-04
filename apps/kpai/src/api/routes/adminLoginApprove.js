import { db } from "../db/index.js";
import { loginRequest, user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { publishAdminEvent } from "../lib/adminEvents.js";

export function adminLoginApprove(fastify) {
  fastify.post("/api/admin/login/student/approve", async (request, reply) => {
    const { loginRequestId } = request.body || {};
    if (!loginRequestId) {
      return error(reply, 400, "VALIDATION_ERROR", "loginRequestId is required");
    }

    const record = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(loginRequest)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(loginRequest.id, loginRequestId))
        .returning();

      if (!updated) return null;

      if (updated.resetPassword) {
        await tx
          .update(user)
          .set({ passwordHash: null, updatedAt: new Date() })
          .where(eq(user.id, updated.userId));
      }

      return updated;
    });

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Login request not found");
    }

    publishAdminEvent("login_request_changed", {
      loginRequestId: record.id,
      userId: record.userId,
      status: record.status,
    });

    return success({ loginRequestId: record.id, status: record.status });
  });
}
