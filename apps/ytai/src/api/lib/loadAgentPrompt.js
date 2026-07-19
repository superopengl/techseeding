import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq, isNull, or } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import isSubject, { DEFAULT_SUBJECT, SUBJECTS } from './tutorSubject.js';
import { GLOBAL_KEY, subjectYearKey } from './agentPromptScope.js';
import { YEARS } from './year.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

function read(rel) {
  return readFileSync(path.join(PROMPTS_DIR, rel), 'utf8').trimEnd();
}

// On-disk defaults. The subject_year default is composed from the per-subject
// and per-year source files (the merged tier's seed content), used as the
// fallback when a draft is missing so a tier is never blank.
const DEFAULT_GLOBAL = read('tutorPersona.md');
const DEFAULT_BY_SUBJECT = Object.fromEntries(
  SUBJECTS.map((s) => [s, read(`subjects/${s}.md`)])
);
const DEFAULT_BY_YEAR = Object.fromEntries(
  YEARS.map((y) => [y, read(`years/${y}.md`)])
);
const DEFAULT_YEAR = YEARS[0];

function defaultSubjectYear(subject, year) {
  return [DEFAULT_BY_SUBJECT[subject], DEFAULT_BY_YEAR[year]]
    .filter(Boolean)
    .join('\n\n');
}

// Load the two admin-editable tiers for a (year, subject) from their mutable
// DRAFT rows (version IS NULL) — the current working content — falling back to
// the on-disk default when a draft is missing. Used to compose the raw prompt
// a publish refines, and as the runtime fallback when a composite hasn't been
// published yet.
export default async function loadAgentPrompt(year, subject) {
  const subjectKey = isSubject(subject) ? subject : DEFAULT_SUBJECT;
  const yearKey = YEARS.includes(year) ? year : DEFAULT_YEAR;
  const syKey = subjectYearKey(subjectKey, yearKey);

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
          and(eq(agentPrompt.scope, 'subject_year'), eq(agentPrompt.scopeKey, syKey))
        )
      )
    );

  const pick = (scope, key) =>
    rows.find((r) => r.scope === scope && r.scopeKey === key)?.content;

  return {
    global: pick('global', GLOBAL_KEY) ?? DEFAULT_GLOBAL,
    subjectYear: pick('subject_year', syKey) ?? defaultSubjectYear(subjectKey, yearKey)
  };
}
