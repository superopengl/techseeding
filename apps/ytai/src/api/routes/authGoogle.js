import { eq, or } from 'drizzle-orm';
import { withTx } from '../db/index.js';
import { user } from '../db/schema.js';
import verifyGoogleIdToken from '../lib/verifyGoogleIdToken.js';

const ALLOWED_ROLES = new Set(['student', 'parent', 'teacher']);
const DEFAULT_ROLE = 'student';

// Resolve a Google OAuth 2.0 access token against Google's userinfo
// endpoint. Returns the same shape as verifyGoogleIdToken so the upsert
// path can treat both flows identically.
async function resolveAccessToken(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    throw new Error(`userinfo lookup failed (${res.status})`);
  }
  const info = await res.json();
  if (!info?.sub) {
    throw new Error('userinfo response missing sub');
  }
  return {
    sub: info.sub,
    email: info.email,
    name: info.name,
    picture: info.picture
  };
}

// POST /api/auth/google
//   body: { credential?, accessToken?, role?: 'student'|'parent'|'teacher' }
//
// `credential` is a Google Identity Services ID token (JWT); `accessToken`
// is a Google OAuth 2.0 access token from `initTokenClient`. Either path
// yields the same `{ sub, email, name, picture }` claims used to upsert
// the user.
export default function authGoogle(fastify) {
  fastify.post('/api/auth/google', async (request, reply) => {
    const { credential, accessToken, role: requestedRole } = request.body || {};
    if (!credential && !accessToken) {
      return reply.code(400).send({ error: 'Missing Google credential' });
    }

    const clientId = process.env.YTAI_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return reply.code(503).send({ error: 'Google SSO is not configured on this server' });
    }

    let claims;
    try {
      if (accessToken) {
        claims = await resolveAccessToken(accessToken);
      } else {
        claims = await verifyGoogleIdToken(credential, { clientId });
      }
    } catch (err) {
      request.log.warn({ err }, 'Google token verification failed');
      return reply.code(401).send({ error: 'Invalid Google credential' });
    }

    const desiredRole = ALLOWED_ROLES.has(requestedRole) ? requestedRole : DEFAULT_ROLE;

    const record = await withTx(async (tx) => {
      const [existing] = await tx
        .select()
        .from(user)
        .where(
          or(
            eq(user.googleId, claims.sub),
            claims.email ? eq(user.email, claims.email) : eq(user.googleId, claims.sub)
          )
        )
        .limit(1);

      if (existing) {
        // Link Google identity onto an existing local account, refresh profile fields.
        const [updated] = await tx
          .update(user)
          .set({
            googleId: claims.sub,
            email: existing.email || claims.email,
            picture: claims.picture || existing.picture,
            authProvider: 'google',
            updatedAt: new Date()
          })
          .where(eq(user.id, existing.id))
          .returning();
        return updated;
      }
      const [created] = await tx
        .insert(user)
        .values({
          name: claims.name,
          role: desiredRole,
          authProvider: 'google',
          email: claims.email,
          googleId: claims.sub,
          picture: claims.picture
        })
        .returning();
      return created;
    });

    const token = await reply.jwtSign(
      { sub: record.id, role: record.role },
      { expiresIn: '30d' }
    );

    return {
      token,
      user: {
        id: record.id,
        name: record.name,
        role: record.role,
        email: record.email,
        picture: record.picture
      }
    };
  });
}
