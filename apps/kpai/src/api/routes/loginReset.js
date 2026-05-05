import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { user, loginRequest } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { isValidUserName } from "../lib/isValidUserName.js";
import { publishAdminEvent } from "../lib/adminEvents.js";

export function loginReset(fastify) {
  fastify.post("/api/login/reset", async (request, reply) => {
    const { userName } = request.body || {};

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

    // Don't reveal whether the username exists. Unknown users get a fake
    // loginRequestId so the UI shows "Waiting for Approval" and eventually
    // times out without leaking that the account doesn't exist.
    if (!matchedUser) {
      return success({ needsApproval: true, loginRequestId: randomUUID(), resetPassword: true });
    }

    const [req] = await db
      .insert(loginRequest)
      .values({ userId: matchedUser.id, status: "requesting", resetPassword: true })
      .onConflictDoUpdate({
        target: loginRequest.userId,
        set: { status: "requesting", resetPassword: true, updatedAt: new Date() },
      })
      .returning();

    publishAdminEvent("login_request_changed", {
      loginRequestId: req.id,
      userId: req.userId,
      status: req.status,
    });

    return success({ needsApproval: true, loginRequestId: req.id, resetPassword: true });
  });
}
