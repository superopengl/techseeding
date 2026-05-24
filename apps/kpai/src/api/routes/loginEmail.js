import { randomBytes } from "crypto";
import { db } from "../db/index.js";
import { user, studentProfile, loginOtp } from "../db/schema.js";
import { sql, eq, and, gt, desc, lte } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { generateOtp } from "../lib/generateOtp.js";
import { sendOtpEmail } from "../lib/sendOtpEmail.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function deriveUserName(email) {
  const local = email.split("@")[0] || "user";
  const base = local.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "user";
  const suffix = randomBytes(2).toString("hex");
  return `${base}_${suffix}`;
}

// POST /api/login/email
//   body: { email }
//
// Issues a 6-digit OTP for the email, stored plain in `login_otp` so the
// admin UI can show it. Auto-creates a `student` user + empty profile if
// the email isn't on file — the kid finishes account info later. Resending
// within RESEND_COOLDOWN_MS short-circuits and returns the same row.
export function loginEmail(fastify) {
  fastify.post("/api/login/email", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { email: rawEmail } = request.body || {};
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email || !EMAIL_RE.test(email)) {
      return error(reply, 400, "VALIDATION_ERROR", "Please enter a valid email address");
    }

    // Opportunistic GC: every OTP request sweeps any expired rows in the
    // table. Cheap (indexed scan on expires_at), and avoids needing a cron.
    await db.delete(loginOtp).where(lte(loginOtp.expiresAt, new Date()));

    const matchedUser = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(user)
        .where(sql`lower(${user.email}) = ${email}`);
      if (existing) return existing;

      const [created] = await tx
        .insert(user)
        .values({
          userName: deriveUserName(email),
          role: "student",
          email,
        })
        .returning();

      await tx.insert(studentProfile).values({ userId: created.id });
      return created;
    });

    // Reuse a live OTP issued in the last RESEND_COOLDOWN_MS so a kid mashing
    // the button doesn't fan out into a dozen codes (any of which would still
    // be valid for 10 minutes).
    const cutoff = new Date(Date.now() - RESEND_COOLDOWN_MS);
    const [recent] = await db
      .select()
      .from(loginOtp)
      .where(
        and(
          eq(loginOtp.userId, matchedUser.id),
          gt(loginOtp.createdAt, cutoff),
          sql`${loginOtp.expiresAt} > now()`,
        ),
      )
      .orderBy(desc(loginOtp.createdAt))
      .limit(1);

    let otpRow;
    if (recent) {
      otpRow = recent;
    } else {
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);
      [otpRow] = await db
        .insert(loginOtp)
        .values({ userId: matchedUser.id, email, code, expiresAt })
        .returning();
    }

    const [profile] = await db
      .select({ firstName: studentProfile.firstName })
      .from(studentProfile)
      .where(eq(studentProfile.userId, matchedUser.id));

    await sendOtpEmail({
      to: email,
      code: otpRow.code,
      expiresAt: otpRow.expiresAt,
      recipientName: profile?.firstName || null,
      log: request.log,
    });

    return success({ expiresAt: otpRow.expiresAt.toISOString() });
  });
}
