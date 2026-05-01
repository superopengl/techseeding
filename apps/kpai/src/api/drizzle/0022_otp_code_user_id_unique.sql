DELETE FROM "otp_code" a USING "otp_code" b WHERE a."id" > b."id" AND a."user_id" = b."user_id";
ALTER TABLE "otp_code" ADD CONSTRAINT "otp_code_user_id_unique" UNIQUE ("user_id");
