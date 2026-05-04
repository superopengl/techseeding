import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { hashPassword, verifyPasswordHash, validatePasswordStrength } from "../lib/passwordHash.js";

export function meChangePassword(fastify) {
  fastify.post("/api/me/change-password", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const { currentPassword, newPassword } = request.body || {};
    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      return error(reply, 400, "VALIDATION_ERROR", "Current password is required");
    }
    const validationError = validatePasswordStrength(newPassword);
    if (validationError) {
      return error(reply, 400, "VALIDATION_ERROR", validationError);
    }

    const [existing] = await db
      .select({ id: user.id, passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, payload.userId));

    if (!existing) {
      return error(reply, 404, "NOT_FOUND", "User not found");
    }
    if (!existing.passwordHash) {
      return error(reply, 409, "PASSWORD_NOT_SET", "Password has not been set yet");
    }

    const ok = await verifyPasswordHash(currentPassword, existing.passwordHash);
    if (!ok) {
      return error(reply, 401, "INVALID_CREDENTIALS", "Current password is incorrect");
    }

    const hash = await hashPassword(newPassword);
    await db
      .update(user)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(user.id, existing.id));

    return success({ ok: true });
  });
}
