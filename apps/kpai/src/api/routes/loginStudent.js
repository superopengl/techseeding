import { db } from "../db/index.js";
import { user, studentProfile, loginRequest } from "../db/schema.js";
import { eq } from "drizzle-orm";

export function loginStudent(fastify) {
  fastify.post("/api/login/student", async (request, reply) => {
    const { studentId } = request.body || {};
    if (!studentId || typeof studentId !== "string" || studentId.trim().length === 0) {
      return reply.status(400).send({ error: "Student ID is required" });
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
      return reply.status(404).send({ error: "Student not found" });
    }

    const { user: studentUser } = result;

    const [loginReq] = await db
      .insert(loginRequest)
      .values({ studentId: studentUser.id, status: "requesting" })
      .onConflictDoUpdate({
        target: loginRequest.studentId,
        set: { status: "requesting", updatedAt: new Date() },
      })
      .returning();

    return { loginRequestId: loginReq.id };
  });
}
