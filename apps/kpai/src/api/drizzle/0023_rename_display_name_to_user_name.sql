ALTER TABLE "user" RENAME COLUMN "display_name" TO "user_name";
ALTER TABLE "user" ADD CONSTRAINT "user_user_name_unique" UNIQUE ("user_name");
