ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_user_name_unique";
DROP INDEX IF EXISTS "user_user_name_idx";
CREATE UNIQUE INDEX "user_user_name_lower_unique_idx" ON "user" (LOWER("user_name"));
