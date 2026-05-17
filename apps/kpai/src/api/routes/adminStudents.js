import { db } from "../db/index.js";
import { user, studentProfile, loginRequest, gallery, userGallery } from "../db/schema.js";
import { eq, sql, inArray } from "drizzle-orm";
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

    const userIds = profiles.map((row) => row.user.id);
    const galleriesByUser = new Map();
    if (userIds.length > 0) {
      const memberships = await db
        .select({
          userId: userGallery.userId,
          id: gallery.id,
          name: gallery.name,
          colorHex: gallery.colorHex,
        })
        .from(userGallery)
        .innerJoin(gallery, eq(userGallery.galleryId, gallery.id))
        .where(inArray(userGallery.userId, userIds))
        .orderBy(gallery.name);
      for (const m of memberships) {
        if (!galleriesByUser.has(m.userId)) galleriesByUser.set(m.userId, []);
        galleriesByUser.get(m.userId).push({ id: m.id, name: m.name, colorHex: m.colorHex });
      }
    }

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
      loginRequestResetPassword: row.login_request?.resetPassword ?? false,
      galleries: galleriesByUser.get(row.user.id) || [],
    }));

    return success(items, { total, page, pageSize });
  });
}
