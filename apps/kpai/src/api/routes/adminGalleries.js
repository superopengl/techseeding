import { db } from "../db/index.js";
import { gallery, userGallery, user, studentProfile } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success } from "../lib/response.js";

export function adminGalleries(fastify) {
  fastify.get("/api/admin/galleries", async () => {
    const [galleries, memberships] = await Promise.all([
      db
        .select({
          id: gallery.id,
          name: gallery.name,
          notes: gallery.notes,
          colorHex: gallery.colorHex,
          createdAt: gallery.createdAt,
          updatedAt: gallery.updatedAt,
        })
        .from(gallery)
        .orderBy(gallery.createdAt),
      db
        .select({
          galleryId: userGallery.galleryId,
          userId: user.id,
          userName: user.userName,
          firstName: studentProfile.firstName,
          lastName: studentProfile.lastName,
          avatarColor: studentProfile.avatarColor,
        })
        .from(userGallery)
        .innerJoin(user, eq(userGallery.userId, user.id))
        .leftJoin(studentProfile, eq(studentProfile.userId, user.id))
        .orderBy(studentProfile.firstName, studentProfile.lastName),
    ]);

    const membersByGallery = new Map();
    for (const m of memberships) {
      if (!membersByGallery.has(m.galleryId)) membersByGallery.set(m.galleryId, []);
      membersByGallery.get(m.galleryId).push({
        userId: m.userId,
        userName: m.userName,
        firstName: m.firstName,
        lastName: m.lastName,
        avatarColor: m.avatarColor,
      });
    }

    return success(galleries.map((g) => ({ ...g, members: membersByGallery.get(g.id) || [] })));
  });
}
