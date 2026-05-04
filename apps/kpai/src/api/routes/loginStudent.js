import { db } from "../db/index.js";
import { user, loginRequest } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { isValidUserName } from "../lib/isValidUserName.js";
import { publishAdminEvent } from "../lib/adminEvents.js";

export function loginStudent(fastify) {
  fastify.post("/api/login/student", async (request, reply) => {
    const { userName } = request.body || {};
    if (!userName || typeof userName !== "string" || userName.trim().length === 0) {
      return error(reply, 400, "VALIDATION_ERROR", "Username is required");
    }
    if (!isValidUserName(userName.trim())) {
      return error(reply, 400, "VALIDATION_ERROR", "Username may only contain letters, digits, underscore, and slash");
    }

    const loginReq = await db.transaction(async (tx) => {
      const [matchedUser] = await tx
        .select()
        .from(user)
        .where(sql`lower(${user.userName}) = lower(${userName.trim()}) and ${user.role} = 'student'`);

      if (!matchedUser) return null;

      const [req] = await tx
        .insert(loginRequest)
        .values({ userId: matchedUser.id, status: "requesting" })
        .onConflictDoUpdate({
          target: loginRequest.userId,
          set: { status: "requesting", updatedAt: new Date() },
        })
        .returning();

      return req;
    });

    if (!loginReq) {
      return error(reply, 404, "NOT_FOUND", "Student not found");
    }

    publishAdminEvent("login_request_changed", {
      loginRequestId: loginReq.id,
      userId: loginReq.userId,
      status: loginReq.status,
    });

    return success({ loginRequestId: loginReq.id });
  });
}
