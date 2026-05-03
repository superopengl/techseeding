CREATE INDEX IF NOT EXISTS "sandbox_user_id_idx" ON "sandbox" ("user_id");
CREATE INDEX IF NOT EXISTS "sandbox_session_sandbox_id_idx" ON "sandbox_session" ("sandbox_id");
CREATE INDEX IF NOT EXISTS "sandbox_session_user_id_idx" ON "sandbox_session" ("user_id");
CREATE INDEX IF NOT EXISTS "sandbox_release_sandbox_id_idx" ON "sandbox_release" ("sandbox_id");
CREATE INDEX IF NOT EXISTS "session_message_sandbox_session_id_idx" ON "session_message" ("sandbox_session_id");
