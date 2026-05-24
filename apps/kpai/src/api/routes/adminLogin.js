import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { createJwtToken } from "../lib/createJwtToken.js";
import { setAuthCookies } from "../lib/setAuthCookies.js";
import { verifyPasswordHash } from "../lib/passwordHash.js";

// POST /api/auth/admin
//   body: { userName, password }
//
// Verifies an admin's username + password against the user table. Only users
// with role="admin" and a non-null password_hash can authenticate here — every
// other failure mode (missing user, wrong password, wrong role) returns the
// same generic INVALID_CREDENTIALS response so we don't leak which case hit.
//
// Lives under /api/auth/* (not /api/admin/*) because the global onRequest hook
// in server.js gates the latter on already-authenticated admin credentials.
export function adminLogin(fastify) {
  fastify.post("/api/auth/admin", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { userName, password } = request.body || {};
    if (typeof userName !== "string" || typeof password !== "string" || !userName.trim() || !password) {
      return error(reply, 400, "VALIDATION_ERROR", "Username and password are required");
    }

    const [matched] = await db
      .select()
      .from(user)
      .where(sql`lower(${user.userName}) = lower(${userName.trim()})`);

    const ok = matched
      && matched.role === "admin"
      && matched.passwordHash
      && (await verifyPasswordHash(password, matched.passwordHash));

    if (!ok) {
      return error(reply, 401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    const token = createJwtToken({ userId: matched.id, role: matched.role });
    setAuthCookies(reply, { token, role: matched.role });
    return success({ role: matched.role });
  });
}
