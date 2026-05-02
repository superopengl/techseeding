ALTER TABLE "session_message" ADD COLUMN "content_length" integer NOT NULL DEFAULT 0;
UPDATE "session_message" SET "content_length" = LENGTH(content::text);
