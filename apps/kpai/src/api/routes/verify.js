import { db } from "../db/index.js";
import { otpCode, user } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { createJwtToken } from "../lib/createJwtToken.js";
import { success, error } from "../lib/response.js";

export function verify(fastify) {
  fastify.post("/api/verify", async (request, reply) => {
    const { code } = request.body || {};
    if (!code || typeof code !== "string" || code.length !== 6) {
      return error(reply, 400, "VALIDATION_ERROR", "A 6-digit code is required");
    }

    const result = await db.transaction(async (tx) => {
      const [otp] = await tx
        .select()
        .from(otpCode)
        .where(
          and(
            eq(otpCode.code, code),
            gt(otpCode.expiredAt, new Date())
          )
        );

      if (!otp) return { error: "INVALID_CODE" };

      await tx.delete(otpCode).where(eq(otpCode.id, otp.id));

      const [found] = await tx
        .select()
        .from(user)
        .where(eq(user.id, otp.userId));

      if (!found) return { error: "NOT_FOUND" };

      return { user: found };
    });

    if (result.error === "INVALID_CODE") {
      return error(reply, 401, "INVALID_CODE", "Invalid or expired code");
    }
    if (result.error === "NOT_FOUND") {
      return error(reply, 404, "NOT_FOUND", "User not found");
    }

    const token = createJwtToken({ userId: result.user.id, role: result.user.role });
    return success({ token, role: result.user.role });
  });
}
