import { db } from "../db/index.js";
import { user, studentProfile, loginRequest } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { success } from "../lib/response.js";
import { parsePagination } from "../lib/parsePagination.js";

export function adminStudents(fastify) {
  fastify.get("/api/admin/students", async (request) => {
    const { page, pageSize, limit, offset } = parsePagination(request.query);

    const [profiles, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(studentProfile)
        .innerJoin(user, eq(studentProfile.userId, user.id))
        .leftJoin(loginRequest, eq(loginRequest.userId, user.id))
        .orderBy(studentProfile.createdAt)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql`count(*)::int` }).from(studentProfile),
    ]);

    const items = profiles.map((row) => ({
      id: row.user.id,
      userName: row.user.userName,
      email: row.user.email,
      firstName: row.student_profile.firstName,
      lastName: row.student_profile.lastName,
      contactNumber: row.student_profile.contactNumber,
      joinedAt: row.student_profile.joinedAt,
      createdAt: row.student_profile.createdAt,
      loginRequestId: row.login_request?.id ?? null,
      loginRequestStatus: row.login_request?.status ?? null,
    }));

    return success(items, { total, page, pageSize });
  });
}
