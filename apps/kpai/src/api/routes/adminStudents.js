import { db } from "../db/index.js";
import { user, studentProfile, loginRequest } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success } from "../lib/response.js";

export function adminStudents(fastify) {
  fastify.get("/api/admin/students", async () => {
    const profiles = await db
      .select()
      .from(studentProfile)
      .innerJoin(user, eq(studentProfile.userId, user.id))
      .leftJoin(loginRequest, eq(loginRequest.userId, user.id))
      .orderBy(studentProfile.createdAt);

    return success(profiles.map((row) => ({
      id: row.user.id,
      userName: row.user.userName,
      email: row.user.email,
      studentId: row.student_profile.studentId,
      firstName: row.student_profile.firstName,
      lastName: row.student_profile.lastName,
      nickname: row.student_profile.nickname,
      joinedAt: row.student_profile.joinedAt,
      createdAt: row.student_profile.createdAt,
      loginRequestId: row.login_request?.id ?? null,
      loginRequestStatus: row.login_request?.status ?? null,
    })));
  });
}
