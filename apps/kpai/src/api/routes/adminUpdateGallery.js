import { db } from "../db/index.js";
import { gallery } from "../db/schema.js";
import { eq, sql, and, ne } from "drizzle-orm";
import { success, error } from "../lib/response.js";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function adminUpdateGallery(fastify) {
  fastify.patch("/api/admin/gallery/:id", async (request, reply) => {
    const { id } = request.params;
    const { name, notes, colorHex } = request.body || {};

    const updates = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return error(reply, 400, "VALIDATION_ERROR", "name cannot be empty");
      }
      const trimmedName = name.trim();
      if (trimmedName.length > 50) {
        return error(reply, 400, "VALIDATION_ERROR", "name must be 50 characters or less");
      }
      const dup = await db
        .select({ id: gallery.id })
        .from(gallery)
        .where(and(sql`lower(${gallery.name}) = lower(${trimmedName})`, ne(gallery.id, id)))
        .limit(1);
      if (dup.length > 0) {
        return error(reply, 409, "CONFLICT", "A gallery with this name already exists");
      }
      updates.name = trimmedName;
    }

    if (notes !== undefined) {
      if (notes !== null && notes.length > 2000) {
        return error(reply, 400, "VALIDATION_ERROR", "notes must be 2000 characters or less");
      }
      updates.notes = notes?.trim() || null;
    }

    if (colorHex !== undefined) {
      if (!HEX_RE.test(colorHex)) {
        return error(reply, 400, "VALIDATION_ERROR", "colorHex must be a #RRGGBB value");
      }
      updates.colorHex = colorHex;
    }

    const [updated] = await db
      .update(gallery)
      .set(updates)
      .where(eq(gallery.id, id))
      .returning();

    if (!updated) {
      return error(reply, 404, "NOT_FOUND", "Gallery not found");
    }

    return success(updated);
  });
}
