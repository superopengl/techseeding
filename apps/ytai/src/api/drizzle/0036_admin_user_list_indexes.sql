-- Index the foreign keys the admin user-list rollup aggregates over. That
-- query groups sessions, their messages, and subject reports per user; each
-- rollup was a sequential scan without a supporting index. These same indexes
-- also back the per-user session list, the transcript read (messages by
-- session), the Reports page list, and the admin data wipe.

CREATE INDEX IF NOT EXISTS "tutor_session_user_id_idx"
  ON "ytai"."tutor_session" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_message_session_id_idx"
  ON "ytai"."session_message" ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subject_report_user_id_idx"
  ON "ytai"."subject_report" ("user_id");
