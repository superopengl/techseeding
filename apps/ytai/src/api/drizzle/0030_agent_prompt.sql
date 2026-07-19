-- Admin-editable three-tier system-prompt stack composed on every tutor
-- turn: one GLOBAL prompt (agent role + product scope), one SUBJECT prompt
-- per subject (content scope, tone, notation), and one YEAR prompt per
-- school year (knowledge boundary + year constraints). The final system
-- prompt prepended to the conversation is `global + subject + year`.
-- Seeded on boot from prompts/tutorPersona.md, prompts/subjects/*.md, and
-- prompts/years/*.md for every missing (scope, scope_key).

DROP TABLE IF EXISTS "ytai"."agent_prompt";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ytai"."agent_prompt" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "scope" text NOT NULL,
  "scope_key" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_prompt_scope_key_uq"
  ON "ytai"."agent_prompt" ("scope", "scope_key");
