import { db } from "../db/index.js";
import { studentProfile, otpCode } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminOtp(fastify) {
  fastify.post("/api/admin/otp/:studentId", async (request, reply) => {
    const { studentId } = request.params;
    const [profile] = await db
      .select()
      .from(studentProfile)
      .where(eq(studentProfile.studentId, studentId));

    if (!profile) {
      return error(reply, 404, "NOT_FOUND", "Student not found");
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db.insert(otpCode).values({ displayName: profile.firstName, code, expiredAt });

    return success({ code, expiredAt });
  });
}
