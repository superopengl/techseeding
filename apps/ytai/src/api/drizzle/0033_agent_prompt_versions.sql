-- Make agent_prompt rows immutable + versioned, matching composite_prompt.
-- Every admin save now inserts a new row with version = previous max + 1 for
-- that (scope, scope_key), building an append-only history; tutor turns read
-- the highest version. The old one-row-per-(scope, scope_key) unique index is
-- replaced by a unique index on (scope, scope_key, version).

ALTER TABLE "ytai"."agent_prompt"
  ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "ytai"."agent_prompt" ALTER COLUMN "version" DROP DEFAULT;
--> statement-breakpoint
DROP INDEX IF EXISTS "ytai"."agent_prompt_scope_key_uq";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_prompt_scope_key_version_uq"
  ON "ytai"."agent_prompt" ("scope", "scope_key", "version");
