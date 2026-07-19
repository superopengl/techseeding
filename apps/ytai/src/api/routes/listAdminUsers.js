import { desc, eq, isNull, ne, or, sql } from 'drizzle-orm';
import db from '../db/index.js';
import {
  sessionMessage,
  subjectReport,
  tutorSession,
  user,
  userProfile
} from '../db/schema.js';

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
    // Per-user session stats, pre-aggregated in ONE pass over tutor_session
    // (left-joined to its messages) and grouped by owner. This replaces the
    // old per-row correlated subqueries: instead of re-running a scan for
    // every user in the outer SELECT, Postgres builds each rollup once as a
    // hash aggregate and hash-joins it to the user list.
    //
    //   sessionCount   = distinct sessions the user started (the left join to
    //                    messages fans rows out, so count DISTINCT the session).
    //   lastActivityAt = newest message across all their sessions — the truest
    //                    "when did this person last use the app" signal.
    // Backed by tutor_session_user_id_idx + session_message_session_id_idx.
    const sessionStats = db()
      .select({
        userId: tutorSession.userId,
        sessionCount: sql`count(distinct ${tutorSession.id})::int`.as(
          'session_count'
        ),
        lastActivityAt: sql`max(${sessionMessage.createdAt})`.as(
          'last_activity_at'
        )
      })
      .from(tutorSession)
      .leftJoin(sessionMessage, eq(sessionMessage.sessionId, tutorSession.id))
      .groupBy(tutorSession.userId)
      .as('session_stats');

    // How many analysis (subject) reports each user has generated. Same
    // single-pass hash aggregate; backed by subject_report_user_id_idx.
    const reportStats = db()
      .select({
        userId: subjectReport.userId,
        reportCount: sql`count(*)::int`.as('report_count')
      })
      .from(subjectReport)
      .groupBy(subjectReport.userId)
      .as('report_stats');

    // One statement, four hash joins — no correlated per-row execution and no
    // application-side N+1. The user's current school year comes from their
    // 1:1 user_profile row (null when they never set one). Counts coalesce to
    // 0 for users with no sessions/reports (the left join yields null).
    const rows = await db()
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        year: userProfile.year,
        createdAt: user.createdAt,
        lastActivityAt: sessionStats.lastActivityAt,
        sessionCount: sql`coalesce(${sessionStats.sessionCount}, 0)`.mapWith(
          Number
        ),
        reportCount: sql`coalesce(${reportStats.reportCount}, 0)`.mapWith(Number)
      })
      .from(user)
      .leftJoin(userProfile, eq(userProfile.userId, user.id))
      .leftJoin(sessionStats, eq(sessionStats.userId, user.id))
      .leftJoin(reportStats, eq(reportStats.userId, user.id))
      .where(
        or(ne(user.authProvider, 'local'), isNull(user.localLoginUserName))
      )
      .orderBy(desc(user.createdAt));

    return { users: rows };
  });
}
