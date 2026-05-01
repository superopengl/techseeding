import { db } from "../db/index.js";
import { user, studentProfile, otpCode } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function sendOtp(fastify) {
  fastify.post("/api/login/send-otp", async (request, reply) => {
    const { email } = request.body || {};
    if (!email || typeof email !== "string" || !email.trim()) {
      return error(reply, 400, "VALIDATION_ERROR", "Email is required");
    }

    const result = await db.transaction(async (tx) => {
      const [found] = await tx
        .select()
        .from(user)
        .where(eq(user.email, email.trim().toLowerCase()));

      if (!found) return null;

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

      const [otp] = await tx.insert(otpCode).values({
        userId: found.id,
        code,
        expiredAt,
      }).onConflictDoUpdate({
        target: otpCode.userId,
        set: { code, expiredAt },
      }).returning({ id: otpCode.id });

      return otp;
    });

    if (!result) {
      return error(reply, 404, "NOT_FOUND", "No user found with this email");
    }

    return success({ id: result.id });
  });
}
