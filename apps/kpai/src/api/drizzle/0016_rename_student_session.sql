ALTER TABLE "student_session" RENAME TO "sandbox_session";
ALTER TABLE "sandbox_session" RENAME CONSTRAINT "student_session_student_id_user_id_fk" TO "sandbox_session_user_id_user_id_fk";
ALTER TABLE "sandbox_session" RENAME CONSTRAINT "student_session_sandbox_id_sandbox_id_fk" TO "sandbox_session_sandbox_id_sandbox_id_fk";
ALTER TABLE "session_message" RENAME CONSTRAINT "session_message_sandbox_session_id_student_session_id_fk" TO "session_message_sandbox_session_id_sandbox_session_id_fk";
