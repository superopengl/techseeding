-- Admin-editable per-(year, subject) system prompt. The hardcoded persona
-- in `src/api/prompts/tutorPersona.md` stays builtin; this table stores the
-- second layer (curriculum-scoping + year-appropriate tone) that admins can
-- edit at runtime. Rows are seeded on server boot from the on-disk defaults
-- in `src/api/prompts/subjects/*.md` for every missing (year, subject).

CREATE TABLE IF NOT EXISTS "ytai"."agent_prompt" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "year" text NOT NULL,
  "subject" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_prompt_year_subject_uq"
  ON "ytai"."agent_prompt" ("year", "subject");
