import { db } from "../db/index.js";
import { sandbox, user, studentProfile, gallery, userGallery } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function galleryExpo(fastify) {
  fastify.get("/api/gallery/:galleryId/expo", async (request, reply) => {
    const { galleryId } = request.params;

    const [g] = await db
      .select({ id: gallery.id, name: gallery.name, colorHex: gallery.colorHex })
      .from(gallery)
      .where(eq(gallery.id, galleryId))
      .limit(1);
    if (!g) {
      return error(reply, 404, "NOT_FOUND", "Gallery not found");
    }

    const rows = await db
      .select({
        id: sandbox.id,
        title: sandbox.title,
        updatedAt: sandbox.updatedAt,
        userId: user.id,
        userName: user.userName,
        firstName: studentProfile.firstName,
        lastName: studentProfile.lastName,
        avatarColor: studentProfile.avatarColor,
      })
      .from(userGallery)
      .innerJoin(user, eq(userGallery.userId, user.id))
      .innerJoin(studentProfile, eq(studentProfile.userId, user.id))
      .innerJoin(sandbox, eq(sandbox.userId, user.id))
      .where(eq(userGallery.galleryId, galleryId))
      .orderBy(desc(sandbox.updatedAt));

    return success({ gallery: g, sandboxes: rows });
  });
}
