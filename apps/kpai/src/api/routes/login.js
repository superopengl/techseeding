import { db } from "../db/index.js";
import { user, loginRequest } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { isValidUserName } from "../lib/isValidUserName.js";
import { verifyPasswordHash } from "../lib/passwordHash.js";
import { createJwtToken } from "../lib/createJwtToken.js";
import { setAuthCookies } from "../lib/setAuthCookies.js";
import { publishAdminEvent } from "../lib/adminEvents.js";

export function login(fastify) {
  fastify.post("/api/login", async (request, reply) => {
    const { userName, password } = request.body || {};

    if (!userName || typeof userName !== "string" || !userName.trim()) {
      return error(reply, 400, "VALIDATION_ERROR", "Username is required");
    }
    if (!isValidUserName(userName.trim())) {
      return error(reply, 400, "VALIDATION_ERROR", "Username may only contain letters, digits, underscore, and slash");
    }

    const [matchedUser] = await db
      .select()
      .from(user)
      .where(sql`lower(${user.userName}) = lower(${userName.trim()})`);

    if (!matchedUser) {
      // Don't reveal whether the username exists. Username-only submissions get
      // a needsPassword response; password attempts fail with INVALID_CREDENTIALS.
      if (typeof password === "string" && password.length > 0) {
        return error(reply, 401, "INVALID_CREDENTIALS", "Wrong username or password");
      }
      return success({ needsPassword: true });
    }

    if (!matchedUser.passwordHash) {
      const [req] = await db
        .insert(loginRequest)
        .values({ userId: matchedUser.id, status: "requesting", resetPassword: false })
        .onConflictDoUpdate({
          target: loginRequest.userId,
          set: { status: "requesting", resetPassword: false, updatedAt: new Date() },
        })
        .returning();

      publishAdminEvent("login_request_changed", {
        loginRequestId: req.id,
        userId: req.userId,
        status: req.status,
      });

      return success({ needsApproval: true, loginRequestId: req.id });
    }

    if (typeof password !== "string" || password.length === 0) {
      return success({ needsPassword: true });
    }

    const ok = await verifyPasswordHash(password, matchedUser.passwordHash);
    if (!ok) {
      return error(reply, 401, "INVALID_CREDENTIALS", "Wrong username or password");
    }

    const token = createJwtToken({ userId: matchedUser.id, role: matchedUser.role });
    setAuthCookies(reply, { token, role: matchedUser.role });
    return success({ role: matchedUser.role });
  });
}
