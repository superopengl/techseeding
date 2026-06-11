import { db } from "../db/index.js";
import { gallery } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminDeleteGallery(fastify) {
  fastify.delete("/api/admin/gallery/:id", async (request, reply) => {
    const { id } = request.params;

    const [deleted] = await db
      .delete(gallery)
      .where(eq(gallery.id, id))
      .returning({ id: gallery.id });

    if (!deleted) {
      return error(reply, 404, "NOT_FOUND", "Gallery not found");
    }

    return success({ id: deleted.id });
  });
}
