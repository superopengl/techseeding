import { desc, isNull, ne, or, sql } from 'drizzle-orm';
import db from '../db/index.js';
import { sessionMessage, tutorSession, user } from '../db/schema.js';

// GET /api/admin/users
//
// Admin dashboard user list. Returns every real user — Google sign-ups,
// email OTP sign-ups, plus any other admins — newest first. The
// bootstrap admin (auth_provider='local' + local_login_user_name set) is filtered
// out: it's a machine-managed login handle, not a person, and surfacing
// it would just add noise to the admin's own management view.
//
// Auth: the global onRequest hook in server.js gates /api/admin/* to
// role=admin, so this handler doesn't need to re-check.
export default function listAdminUsers(fastify) {
  fastify.get('/api/admin/users', async () => {
    // Last activity = the most recent tutor message the user sent, across all
    // their sessions. It's the truest "when did this person last use the app"
    // signal; createdAt only tells us when they signed up. Correlated scalar
    // subquery so the outer SELECT stays a clean per-user row (no join fanout,
    // no GROUP BY over every user column). Null for users who never tutored.
    // Aliased tables (sm/ts) + an explicit "user".id correlation: this
    // drizzle build renders bare column refs unqualified, so an unaliased
    // subquery makes "id" / "user_id" ambiguous across the two joined tables.
    const lastActivityAt = sql`(
      SELECT MAX(sm.created_at)
      FROM ${sessionMessage} sm
      JOIN ${tutorSession} ts ON ts.id = sm.session_id
      WHERE ts.user_id = "user".id
    )`.as('last_activity_at');

    const rows = await db()
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        createdAt: user.createdAt,
        lastActivityAt
      })
      .from(user)
      .where(
        or(ne(user.authProvider, 'local'), isNull(user.localLoginUserName))
      )
      .orderBy(desc(user.createdAt));

    return { users: rows };
  });
}
