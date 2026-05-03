import { db } from "../db/index.js";
import { studentProfile, otpCode } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminOtp(fastify) {
  fastify.post("/api/admin/otp/:studentId", async (request, reply) => {
    const { studentId } = request.params;

    const result = await db.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(studentProfile)
        .where(eq(studentProfile.studentId, studentId));

      if (!profile) return null;

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await tx.insert(otpCode).values({ userId: profile.userId, code, expiredAt });

      return { code, expiredAt };
    });

    if (!result) {
      return error(reply, 404, "NOT_FOUND", "Student not found");
    }

    return success(result);
  });
}
