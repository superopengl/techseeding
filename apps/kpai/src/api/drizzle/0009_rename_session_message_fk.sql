ALTER TABLE "session_message" RENAME COLUMN "sandbox_id" TO "sandbox_session_id";--> statement-breakpoint
ALTER TABLE "session_message" DROP CONSTRAINT "sandbox_message_sandbox_id_sandbox_id_fk";--> statement-breakpoint
ALTER TABLE "session_message" ADD CONSTRAINT "session_message_sandbox_session_id_student_session_id_fk" FOREIGN KEY ("sandbox_session_id") REFERENCES "student_session"("id") ON DELETE no action ON UPDATE no action;
