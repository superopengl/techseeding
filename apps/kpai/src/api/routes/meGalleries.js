import { db } from "../db/index.js";
import { gallery, userGallery } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

export function meGalleries(fastify) {
  fastify.get("/api/me/galleries", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
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
      .where(eq(userGallery.userId, payload.userId))
      .orderBy(gallery.name);

    return success(rows);
  });
}
