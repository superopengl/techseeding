import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNull } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import { SUBJECTS } from './tutorSubject.js';
import {
  GLOBAL_KEY,
  REPORT_SCOPE,
  REPORT_BODY_KEY,
  REPORT_TITLE_KEY,
  subjectYearKey
} from './agentPromptScope.js';
import { YEARS } from './year.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

function read(rel) {
  return readFileSync(path.join(PROMPTS_DIR, rel), 'utf8').trimEnd();
}

// Idempotent boot seed. Ensures a mutable DRAFT row (version NULL) exists for
// the global tier, each subject×year cell, and the two analysis-report prompts.
// The global draft comes from prompts/tutorPersona.md; each subject_year draft
// is composed from the per-subject and per-year source files
// (prompts/subjects/*.md + prompts/years/*.md); the report drafts come from
// prompts/reports/{body,title}.md. Only missing drafts are inserted — existing
// drafts (which the editor mutates) and any published versions are left
// untouched.
export default async function seedAgentPrompts(log) {
  const wanted = [
    { scope: 'global', scopeKey: GLOBAL_KEY, version: null, content: read('tutorPersona.md') },
    ...SUBJECTS.flatMap((s) =>
      YEARS.map((y) => ({
        scope: 'subject_year',
        scopeKey: subjectYearKey(s, y),
        version: null,
        content: [read(`subjects/${s}.md`), read(`years/${y}.md`)].join('\n\n')
      }))
    ),
    { scope: REPORT_SCOPE, scopeKey: REPORT_BODY_KEY, version: null, content: read('reports/body.md') },
    { scope: REPORT_SCOPE, scopeKey: REPORT_TITLE_KEY, version: null, content: read('reports/title.md') }
  ];
  try {
    const existing = await db()
      .select({ scope: agentPrompt.scope, scopeKey: agentPrompt.scopeKey })
      .from(agentPrompt)
      .where(isNull(agentPrompt.version));
    const have = new Set(existing.map((r) => `${r.scope}:${r.scopeKey}`));
    const toInsert = wanted.filter((r) => !have.has(`${r.scope}:${r.scopeKey}`));
    if (toInsert.length) {
      await db().insert(agentPrompt).values(toInsert);
    }
  } catch (err) {
    log?.error({ err }, 'seedAgentPrompts failed');
  }
}
