import { db } from "../db/index.js";
import { gallery, userGallery, user } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminSetUserGalleries(fastify) {
  fastify.put("/api/admin/user/:userId/galleries", async (request, reply) => {
    const { userId } = request.params;
    const { galleryIds } = request.body || {};

    if (!Array.isArray(galleryIds)) {
      return error(reply, 400, "VALIDATION_ERROR", "galleryIds must be an array");
    }

    const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
    if (!target) {
      return error(reply, 404, "NOT_FOUND", "User not found");
    }

    const uniqueIds = [...new Set(galleryIds)];
    if (uniqueIds.length > 0) {
      const existing = await db
        .select({ id: gallery.id })
        .from(gallery)
        .where(inArray(gallery.id, uniqueIds));
      if (existing.length !== uniqueIds.length) {
        return error(reply, 400, "VALIDATION_ERROR", "One or more galleryIds do not exist");
      }
    }

    const result = await db.transaction(async (tx) => {
      await tx.delete(userGallery).where(eq(userGallery.userId, userId));
      if (uniqueIds.length > 0) {
        await tx
          .insert(userGallery)
          .values(uniqueIds.map((galleryId) => ({ userId, galleryId })));
      }
      return tx
        .select({
          id: gallery.id,
          name: gallery.name,
          notes: gallery.notes,
          colorHex: gallery.colorHex,
        })
        .from(userGallery)
        .innerJoin(gallery, eq(userGallery.galleryId, gallery.id))
        .where(eq(userGallery.userId, userId))
        .orderBy(gallery.name);
    });

    return success(result);
  });
}
