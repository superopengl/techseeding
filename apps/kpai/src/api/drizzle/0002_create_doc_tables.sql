-- Drop old otp_code table (from migration 0001) and recreate per db-schema.md
DROP TABLE IF EXISTS "otp_code";

CREATE TABLE "otp_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"code" char(6) NOT NULL,
	"expired_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE "student_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"nickname" text,
	"dob" date,
	"gender" text,
	"school" text,
	"home_address" text,
	"contact_number" text,
	"custodian_name" text,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_profile_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "student_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"logged_in_at" timestamp,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "sandbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_session_id" uuid NOT NULL,
	"sandbox_root_url" text NOT NULL,
	"title" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "sandbox_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandbox_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "student_session" ADD CONSTRAINT "student_session_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "sandbox" ADD CONSTRAINT "sandbox_student_session_id_student_session_id_fk" FOREIGN KEY ("student_session_id") REFERENCES "student_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "sandbox_message" ADD CONSTRAINT "sandbox_message_sandbox_id_sandbox_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "sandbox"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
