ALTER TABLE "otp_code" ADD COLUMN "user_id" uuid;
UPDATE "otp_code" SET "user_id" = (SELECT "id" FROM "user" LIMIT 1) WHERE "user_id" IS NULL;
ALTER TABLE "otp_code" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "otp_code" ADD CONSTRAINT "otp_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id");
ALTER TABLE "otp_code" DROP COLUMN "display_name";
ALTER TABLE "otp_code" DROP COLUMN "updated_at";
