-- Merge the separate subject and year tiers into one subject_year tier keyed
-- "<subject>:<year>" (e.g. "math:Y3"). The agent_prompt table structure is
-- unchanged — only the scope taxonomy changes — so this is a data migration.
--
-- Fold each (subject draft, year draft) pair into a subject_year draft by
-- concatenating their content, then drop the old subject/year rows (drafts and
-- any published versions). On a fresh database with no subject/year rows this
-- is a no-op; the reshaped boot seed creates the subject_year drafts directly.

INSERT INTO "ytai"."agent_prompt" ("scope", "scope_key", "version", "content")
SELECT 'subject_year', s."scope_key" || ':' || y."scope_key", NULL,
       s."content" || E'\n\n' || y."content"
FROM "ytai"."agent_prompt" s
JOIN "ytai"."agent_prompt" y
  ON y."scope" = 'year' AND y."version" IS NULL
WHERE s."scope" = 'subject' AND s."version" IS NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DELETE FROM "ytai"."agent_prompt" WHERE "scope" IN ('subject', 'year');
