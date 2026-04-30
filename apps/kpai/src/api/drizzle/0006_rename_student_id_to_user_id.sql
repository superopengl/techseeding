ALTER TABLE "sandbox" ADD COLUMN "user_id" uuid NOT NULL REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "login_request" RENAME COLUMN "student_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "student_session" RENAME COLUMN "student_id" TO "user_id";
