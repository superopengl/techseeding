import { db } from "../db/index.js";
import { user, loginRequest } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { isValidUserName } from "../lib/isValidUserName.js";
import { verifyPasswordHash } from "../lib/passwordHash.js";
import { createJwtToken } from "../lib/createJwtToken.js";
import { publishAdminEvent } from "../lib/adminEvents.js";

async function upsertLoginRequest(userId, resetPassword) {
  const [req] = await db
    .insert(loginRequest)
    .values({ userId, status: "requesting", resetPassword })
    .onConflictDoUpdate({
      target: loginRequest.userId,
      set: { status: "requesting", resetPassword, updatedAt: new Date() },
    })
    .returning();

  publishAdminEvent("login_request_changed", {
    loginRequestId: req.id,
    userId: req.userId,
    status: req.status,
  });

  return req;
}

export function login(fastify) {
  fastify.post("/api/login", async (request, reply) => {
    const { userName, password, resetPassword } = request.body || {};

    if (!userName || typeof userName !== "string" || !userName.trim()) {
      return error(reply, 400, "VALIDATION_ERROR", "Username is required");
    }
    if (!isValidUserName(userName.trim())) {
      return error(reply, 400, "VALIDATION_ERROR", "Username may only contain letters, digits, underscore, and slash");
    }

    const [matchedUser] = await db
      .select()
      .from(user)
      .where(sql`lower(${user.userName}) = lower(${userName.trim()}) and ${user.role} = 'student'`);

    if (!matchedUser) {
      return error(reply, 401, "INVALID_CREDENTIALS", "Wrong username or password");
    }

    if (resetPassword === true) {
      const req = await upsertLoginRequest(matchedUser.id, true);
      return success({ needsApproval: true, loginRequestId: req.id, resetPassword: true });
    }

    if (!matchedUser.passwordHash) {
      const req = await upsertLoginRequest(matchedUser.id, false);
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
    return success({ token, role: matchedUser.role });
  });
}
