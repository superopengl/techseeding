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

    const [result] = await db
      .select({
        user: user,
        profile: studentProfile,
      })
      .from(studentProfile)
      .innerJoin(user, eq(user.id, studentProfile.userId))
      .where(eq(studentProfile.studentId, studentId.trim()));

    if (!result) {
      return error(reply, 404, "NOT_FOUND", "Student not found");
    }

    const { user: studentUser } = result;

    const [loginReq] = await db
      .insert(loginRequest)
      .values({ userId: studentUser.id, status: "requesting" })
      .onConflictDoUpdate({
        target: loginRequest.userId,
        set: { status: "requesting", updatedAt: new Date() },
      })
      .returning();

    return success({ loginRequestId: loginReq.id });
  });
}
