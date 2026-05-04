import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";
import { hashPassword, validatePasswordStrength } from "../lib/passwordHash.js";

export function meSetPassword(fastify) {
  fastify.post("/api/me/set-password", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const { password } = request.body || {};
    const validationError = validatePasswordStrength(password);
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

    if (existing.passwordHash) {
      return error(reply, 409, "PASSWORD_ALREADY_SET", "Password is already set; use change password instead");
    }

    const hash = await hashPassword(password);
    await db
      .update(user)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(user.id, existing.id));

    return success({ ok: true });
  });
}
