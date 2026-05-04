ALTER TABLE "login_request" ADD COLUMN "reset_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password_hash" text;