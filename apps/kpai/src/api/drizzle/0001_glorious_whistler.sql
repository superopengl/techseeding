CREATE TABLE "otp_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"code" char(6) NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expired_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
