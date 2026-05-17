import { db } from "../db/index.js";
import { gallery, userGallery, user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminUserGalleries(fastify) {
  fastify.get("/api/admin/user/:userId/galleries", async (request, reply) => {
    const { userId } = request.params;

    const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
    if (!target) {
      return error(reply, 404, "NOT_FOUND", "User not found");
    }

    const rows = await db
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

    return success(rows);
  });
}
