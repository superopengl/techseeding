DROP VIEW IF EXISTS "user_otp_code_view";
CREATE OR REPLACE VIEW "user_info_view" AS
SELECT
  u."id" AS "user_id",
  u."user_name",
  u."role",
  u."email",
  sp."first_name",
  sp."last_name",
  sp."gender",
  sp."contact_number" AS "phone",
  sp."notes",
  oc."code" AS "otp_code",
  oc."created_at" AS "otp_code_created_at",
  oc."expired_at" AS "otp_code_expired_at"
FROM "user" u
LEFT JOIN "otp_code" oc ON oc."user_id" = u."id"
LEFT JOIN "student_profile" sp ON sp."user_id" = u."id";
