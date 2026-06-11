DROP TABLE "login_request" CASCADE;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "student_profile" ALTER COLUMN "first_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profile" ALTER COLUMN "last_name" DROP NOT NULL;--> statement-breakpoint
CREATE TABLE "login_otp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "login_otp" ADD CONSTRAINT "login_otp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_otp_user_id_idx" ON "login_otp" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_otp_email_idx" ON "login_otp" USING btree (lower("email"));
