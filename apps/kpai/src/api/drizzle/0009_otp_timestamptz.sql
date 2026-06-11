ALTER TABLE "login_otp" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone USING "expires_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "login_otp" ALTER COLUMN "consumed_at" SET DATA TYPE timestamp with time zone USING "consumed_at" AT TIME ZONE 'UTC';
