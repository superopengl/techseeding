import { db } from "../db/index.js";
import { user, otpCode } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";

export function adminOtp(fastify) {
  fastify.post("/api/admin/otp/:userName", async (request, reply) => {
    const { userName } = request.params;

    const result = await db.transaction(async (tx) => {
      const [matchedUser] = await tx
        .select()
        .from(user)
        .where(sql`lower(${user.userName}) = lower(${userName}) and ${user.role} = 'student'`);

      if (!matchedUser) return null;

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await tx.insert(otpCode).values({ userId: matchedUser.id, code, expiredAt });

      return { code, expiredAt };
    });

    if (!result) {
      return error(reply, 404, "NOT_FOUND", "Student not found");
    }

    return success(result);
  });
}
