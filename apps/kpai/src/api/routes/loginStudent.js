import { db } from "../db/index.js";
import { user, studentProfile, loginRequest } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function loginStudent(fastify) {
  fastify.post("/api/login/student", async (request, reply) => {
    const { studentId } = request.body || {};
    if (!studentId || typeof studentId !== "string" || studentId.trim().length === 0) {
      return error(reply, 400, "VALIDATION_ERROR", "Student ID is required");
    }
    if (!/^[A-Z1-9]{6}$/i.test(studentId.trim())) {
      return error(reply, 400, "VALIDATION_ERROR", "Student ID must be exactly 6 letters or digits (no zero)");
    }

    const loginReq = await db.transaction(async (tx) => {
      const [result] = await tx
        .select({
          user: user,
          profile: studentProfile,
        })
        .from(studentProfile)
        .innerJoin(user, eq(user.id, studentProfile.userId))
        .where(eq(studentProfile.studentId, studentId.trim()));

      if (!result) return null;

      const [req] = await tx
        .insert(loginRequest)
        .values({ userId: result.user.id, status: "requesting" })
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

    return success({ loginRequestId: loginReq.id });
  });
}
