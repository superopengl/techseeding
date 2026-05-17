import { db } from "../db/index.js";
import { gallery } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function adminCreateGallery(fastify) {
  fastify.post("/api/admin/gallery", async (request, reply) => {
    const { name, notes, colorHex } = request.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return error(reply, 400, "VALIDATION_ERROR", "name is required");
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return error(reply, 400, "VALIDATION_ERROR", "name must be 50 characters or less");
    }
    if (notes && notes.length > 2000) {
      return error(reply, 400, "VALIDATION_ERROR", "notes must be 2000 characters or less");
    }
    if (colorHex && !HEX_RE.test(colorHex)) {
      return error(reply, 400, "VALIDATION_ERROR", "colorHex must be a #RRGGBB value");
    }

    const existing = await db
      .select({ id: gallery.id })
      .from(gallery)
      .where(sql`lower(${gallery.name}) = lower(${trimmedName})`)
      .limit(1);
    if (existing.length > 0) {
      return error(reply, 409, "CONFLICT", "A gallery with this name already exists");
    }

    const [created] = await db
      .insert(gallery)
      .values({
        name: trimmedName,
        notes: notes?.trim() || null,
        ...(colorHex ? { colorHex } : {}),
      })
      .returning();

    return reply.status(201).send(success(created));
  });
}
