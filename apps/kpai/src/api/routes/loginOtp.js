import { db } from "../db/index.js";
import { user, loginOtp as loginOtpTable } from "../db/schema.js";
import { sql, eq, desc } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { createJwtToken } from "../lib/createJwtToken.js";
import { setAuthCookies } from "../lib/setAuthCookies.js";

const MAX_ATTEMPTS = 5;
const CODE_RE = /^\d{6}$/;

// POST /api/login/otp
//   body: { email, code }
//
// Verifies the 6-digit code against the latest unconsumed OTP for the email.
// Counts wrong attempts and burns the row after MAX_ATTEMPTS to limit
// brute-force. On success, marks the row consumed and issues the same auth
// cookies the Google SSO path uses.
export function loginOtp(fastify) {
  fastify.post("/api/login/otp", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { email: rawEmail, code: rawCode } = request.body || {};
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const code = typeof rawCode === "string" ? rawCode.trim() : "";
    if (!email || !CODE_RE.test(code)) {
      return error(reply, 400, "VALIDATION_ERROR", "Email and 6-digit code are required");
    }

    const [row] = await db
      .select()
      .from(loginOtpTable)
      .where(sql`lower(${loginOtpTable.email}) = ${email}`)
      .orderBy(desc(loginOtpTable.createdAt))
      .limit(1);

    if (!row) {
      return error(reply, 404, "OTP_NOT_FOUND", "No active sign-in code for this email. Please request a new one.");
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      // Expired rows are GC'd on the next email request anyway; clear this one
      // eagerly so the admin column doesn't keep flashing a dead code.
      await db.delete(loginOtpTable).where(eq(loginOtpTable.id, row.id));
      return error(reply, 410, "OTP_EXPIRED", "This sign-in code has expired. Please request a new one.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      return error(reply, 429, "OTP_LOCKED", "Too many wrong attempts. Please request a new code.");
    }

    if (row.code !== code) {
      await db
        .update(loginOtpTable)
        .set({ attempts: row.attempts + 1 })
        .where(eq(loginOtpTable.id, row.id));
      return error(reply, 401, "OTP_INVALID", "That code didn't match. Please try again.");
    }

    const [matchedUser] = await db.select().from(user).where(eq(user.id, row.userId));
    if (!matchedUser) {
      return error(reply, 500, "USER_MISSING", "Account missing — please contact your teacher");
    }

    // Burn the row on successful login so the same code can't be replayed and
    // the admin UI immediately drops the stale entry.
    await db.delete(loginOtpTable).where(eq(loginOtpTable.id, row.id));

    const token = createJwtToken({ userId: matchedUser.id, role: matchedUser.role });
    setAuthCookies(reply, { token, role: matchedUser.role });
    return success({ role: matchedUser.role });
  });
}
