-- Published, AI-refined composite system prompt per (subject, year). The
-- three editable tiers in agent_prompt (global + subject + year) are composed
-- and refined into one coherent prompt via the admin "Publish" action; the
-- result is stored here and read on every tutor turn. When a (subject, year)
-- has no published row, the runtime falls back to composing the tiers live.

CREATE TABLE IF NOT EXISTS "ytai"."composite_prompt" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject" text NOT NULL,
  "year" text NOT NULL,
  "content" text NOT NULL,
  "source_hash" text,
  "provider" text,
  "model" text,
  "model_version" text,
  "refined_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "composite_prompt_subject_year_uq"
  ON "ytai"."composite_prompt" ("subject", "year");
