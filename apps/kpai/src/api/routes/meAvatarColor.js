import { db } from "../db/index.js";
import { studentProfile } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function meAvatarColor(fastify) {
  fastify.patch("/api/me/avatar-color", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const { avatarColor } = request.body || {};
    if (typeof avatarColor !== "string" || !HEX_COLOR_RE.test(avatarColor)) {
      return error(reply, 400, "VALIDATION_ERROR", "avatarColor must be a #RRGGBB hex string");
    }

    const normalized = avatarColor.toLowerCase();

    const [updated] = await db
      .update(studentProfile)
      .set({ avatarColor: normalized, updatedAt: new Date() })
      .where(eq(studentProfile.userId, payload.userId))
      .returning({ avatarColor: studentProfile.avatarColor });

    if (!updated) {
      return error(reply, 404, "NOT_FOUND", "Student profile not found");
    }

    return success({ avatarColor: updated.avatarColor });
  });
}
