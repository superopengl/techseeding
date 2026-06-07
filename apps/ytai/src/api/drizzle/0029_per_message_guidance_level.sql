-- Move tutor pacing (guided / balanced / direct) from session-level to
-- message-level. Each user message now carries the pacing it asked for,
-- so the student can flip the dial mid-session and the audit log reflects
-- exactly what was requested per turn.
--
-- Pre-existing user rows keep `guidance_level` NULL; readers fall back to
-- the default ('direct') for those. No backfill from the old
-- tutor_session.guidance_level: legacy sessions were dominated by the
-- 'direct' default and stamping the column-default onto every historical
-- user row would lose more signal than it preserves.

ALTER TABLE "ytai"."session_message" ADD COLUMN IF NOT EXISTS "guidance_level" text;
--> statement-breakpoint
ALTER TABLE "ytai"."tutor_session" DROP COLUMN IF EXISTS "guidance_level";
