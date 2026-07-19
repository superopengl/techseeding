import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq, isNull, or } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import isSubject, { DEFAULT_SUBJECT, SUBJECTS } from './tutorSubject.js';
import { GLOBAL_KEY } from './agentPromptScope.js';
import { YEARS } from './year.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

function read(rel) {
  return readFileSync(path.join(PROMPTS_DIR, rel), 'utf8').trimEnd();
}

// On-disk defaults per tier. Back the fallback path when a DB row is missing
// (e.g. race between boot-seed and the first turn) so a tier is never blank.
const DEFAULT_GLOBAL = read('tutorPersona.md');
const DEFAULT_BY_SUBJECT = Object.fromEntries(
  SUBJECTS.map((s) => [s, read(`subjects/${s}.md`)])
);
const DEFAULT_BY_YEAR = Object.fromEntries(
  YEARS.map((y) => [y, read(`years/${y}.md`)])
);

const DEFAULT_YEAR = YEARS[0];

// Load the three admin-editable prompt tiers for a (year, subject) from their
// mutable DRAFT rows (version IS NULL) — i.e. the current working content —
// falling back to the on-disk default when a draft is missing. Used to compose
// the raw prompt that a publish refines, and as the runtime fallback when a
// composite hasn't been published yet, so unpublished draft edits still drive
// tutoring until a publish happens.
export default async function loadAgentPrompt(year, subject) {
  const subjectKey = isSubject(subject) ? subject : DEFAULT_SUBJECT;
  const yearKey = YEARS.includes(year) ? year : DEFAULT_YEAR;

  const rows = await db()
    .select({
      scope: agentPrompt.scope,
      scopeKey: agentPrompt.scopeKey,
      content: agentPrompt.content
    })
    .from(agentPrompt)
    .where(
      and(
        isNull(agentPrompt.version),
        or(
          and(eq(agentPrompt.scope, 'global'), eq(agentPrompt.scopeKey, GLOBAL_KEY)),
          and(eq(agentPrompt.scope, 'subject'), eq(agentPrompt.scopeKey, subjectKey)),
          and(eq(agentPrompt.scope, 'year'), eq(agentPrompt.scopeKey, yearKey))
        )
      )
    );

  const pick = (scope, key) =>
    rows.find((r) => r.scope === scope && r.scopeKey === key)?.content;

  return {
    global: pick('global', GLOBAL_KEY) ?? DEFAULT_GLOBAL,
    subject: pick('subject', subjectKey) ?? DEFAULT_BY_SUBJECT[subjectKey],
    year: pick('year', yearKey) ?? DEFAULT_BY_YEAR[yearKey]
  };
}
