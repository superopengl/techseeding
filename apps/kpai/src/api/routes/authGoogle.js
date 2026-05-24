import { randomBytes } from "crypto";
import { db } from "../db/index.js";
import { user, studentProfile } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { createJwtToken } from "../lib/createJwtToken.js";
import { setAuthCookies } from "../lib/setAuthCookies.js";
import { verifyGoogleIdToken } from "../lib/verifyGoogleIdToken.js";

// Derive a userName from a Google email: local-part sanitized to the allowed
// charset, plus a 4-char hex suffix to avoid collisions. The display can be
// edited later by an admin; this is just a stable internal identifier.
function deriveUserName(email) {
  const local = email.split("@")[0] || "user";
  const base = local.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "user";
  const suffix = randomBytes(2).toString("hex");
  return `${base}_${suffix}`;
}

function splitName(claims) {
  if (claims.givenName || claims.familyName) {
    return {
      firstName: claims.givenName || claims.familyName,
      lastName: claims.familyName || claims.givenName,
    };
  }
  const parts = (claims.name || claims.email || "").trim().split(/\s+/);
  return {
    firstName: parts[0] || claims.email,
    lastName: parts.slice(1).join(" ") || parts[0] || claims.email,
  };
}

// POST /api/auth/google
//   body: { credential: <google_id_token> }
//
// Verifies the Google credential, finds an existing kpai user by email
// (case-insensitive), or creates a new `student` user + profile from the
// Google profile. Sets the same auth cookies as the password login so
// downstream API calls work identically.
export function authGoogle(fastify) {
  fastify.post("/api/auth/google", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { credential } = request.body || {};
    if (!credential) {
      return error(reply, 400, "VALIDATION_ERROR", "Missing Google credential");
    }

    const clientId = process.env.KPAI_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return error(reply, 503, "SSO_NOT_CONFIGURED", "Google sign-in is not configured");
    }

    let claims;
    try {
      claims = await verifyGoogleIdToken(credential, { clientId });
    } catch (err) {
      request.log.warn({ err }, "Google ID token verification failed");
      return error(reply, 401, "INVALID_CREDENTIALS", "Invalid Google credential");
    }

    if (!claims.email) {
      return error(reply, 401, "INVALID_CREDENTIALS", "Google account is missing an email");
    }

    let [matchedUser] = await db
      .select()
      .from(user)
      .where(sql`lower(${user.email}) = lower(${claims.email})`);

    if (!matchedUser) {
      const { firstName, lastName } = splitName(claims);
      matchedUser = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(user)
          .values({
            userName: deriveUserName(claims.email),
            role: "student",
            email: claims.email,
          })
          .returning();

        await tx.insert(studentProfile).values({
          userId: created.id,
          firstName,
          lastName,
        });

        return created;
      });
      request.log.info({ userId: matchedUser.id, email: matchedUser.email }, "Auto-created student via Google SSO");
    }

    const token = createJwtToken({ userId: matchedUser.id, role: matchedUser.role });
    setAuthCookies(reply, { token, role: matchedUser.role });
    return success({ role: matchedUser.role });
  });
}
