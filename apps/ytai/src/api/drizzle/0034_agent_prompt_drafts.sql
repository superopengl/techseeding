-- Give each tier a mutable DRAFT row (version IS NULL) alongside its
-- immutable versioned rows. The editor autosaves into the draft; publishing a
-- composite snapshots the draft into a new immutable version. Existing seeded
-- rows (one per tier) become the drafts.

DROP INDEX IF EXISTS "ytai"."agent_prompt_scope_key_version_uq";
--> statement-breakpoint
ALTER TABLE "ytai"."agent_prompt" ALTER COLUMN "version" DROP NOT NULL;
--> statement-breakpoint
-- Existing rows (each tier's single seeded v1) become the mutable draft.
UPDATE "ytai"."agent_prompt" SET "version" = NULL;
--> statement-breakpoint
-- At most one draft per tier.
CREATE UNIQUE INDEX IF NOT EXISTS "agent_prompt_draft_uq"
  ON "ytai"."agent_prompt" ("scope", "scope_key")
  WHERE "version" IS NULL;
--> statement-breakpoint
-- Unique version numbers among published rows.
CREATE UNIQUE INDEX IF NOT EXISTS "agent_prompt_scope_key_version_uq"
  ON "ytai"."agent_prompt" ("scope", "scope_key", "version")
  WHERE "version" IS NOT NULL;
