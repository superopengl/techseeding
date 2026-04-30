import { db } from "../db/index.js";
import { otpCode, studentProfile } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function verify(fastify) {
  fastify.post("/api/verify", async (request, reply) => {
    const { code } = request.body || {};
    if (!code || typeof code !== "string" || code.length !== 6) {
      return error(reply, 400, "VALIDATION_ERROR", "A 6-digit code is required");
    }

    const [otp] = await db
      .select()
      .from(otpCode)
      .where(
        and(
          eq(otpCode.code, code),
          gt(otpCode.expiredAt, new Date())
        )
      );

    if (!otp) {
      return error(reply, 401, "INVALID_CODE", "Invalid or expired code");
    }

    // Delete used OTP
    await db.delete(otpCode).where(eq(otpCode.id, otp.id));

    // Find the student profile by display name
    const [profile] = await db
      .select()
      .from(studentProfile)
      .where(eq(studentProfile.firstName, otp.displayName));

    if (!profile) {
      return error(reply, 404, "NOT_FOUND", "Student not found");
    }

    return success({ studentId: profile.studentId });
  });
}
