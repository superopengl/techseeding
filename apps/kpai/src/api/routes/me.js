import { db } from "../db/index.js";
import { user, studentProfile } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

export function me(fastify) {
  fastify.get("/api/me", async (request, reply) => {
    const payload = verifyToken(request);
    if (!payload) {
      return error(reply, 401, "UNAUTHORIZED", "Authentication required");
    }

    const [record] = await db
      .select({
        userName: user.userName,
        role: user.role,
        passwordHash: user.passwordHash,
        firstName: studentProfile.firstName,
        lastName: studentProfile.lastName,
      })
      .from(user)
      .leftJoin(studentProfile, eq(studentProfile.userId, user.id))
      .where(eq(user.id, payload.userId));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "User not found");
    }

    const { passwordHash, ...rest } = record;
    return success({ ...rest, hasPassword: Boolean(passwordHash) });
  });
}
