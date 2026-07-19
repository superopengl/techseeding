-- Make composite_prompt rows immutable + versioned. Every publish now inserts
-- a new row with version = previous max + 1 for that (subject, year), building
-- an append-only history; tutor turns read the highest version. The old
-- one-row-per-(subject, year) unique index is replaced by a unique index on
-- (subject, year, version).

ALTER TABLE "ytai"."composite_prompt"
  ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "ytai"."composite_prompt" ALTER COLUMN "version" DROP DEFAULT;
--> statement-breakpoint
DROP INDEX IF EXISTS "ytai"."composite_prompt_subject_year_uq";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "composite_prompt_subject_year_version_uq"
  ON "ytai"."composite_prompt" ("subject", "year", "version");
