import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import isSubject, { DEFAULT_SUBJECT, SUBJECTS } from './tutorSubject.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

// One default file per subject shipped in the repo. Backs the fallback path
// when a (year, subject) row is missing (e.g. race between boot-seed and
// first turn) so the caller never sees an empty string.
const DEFAULT_BY_SUBJECT = Object.fromEntries(
  SUBJECTS.map((s) => [
    s,
    readFileSync(path.join(PROMPTS_DIR, `subjects/${s}.md`), 'utf8').trimEnd()
  ])
);

// Load the admin-editable (year, subject) system prompt from the database.
// Every tutor turn calls this, so an edit made in the admin UI takes effect
// on the very next message — no server restart needed.
export default async function loadAgentPrompt(year, subject) {
  const subjectKey = isSubject(subject) ? subject : DEFAULT_SUBJECT;
  const [row] = await db()
    .select({ content: agentPrompt.content })
    .from(agentPrompt)
    .where(and(eq(agentPrompt.year, year), eq(agentPrompt.subject, subjectKey)))
    .limit(1);
  if (row) return row.content;
  return DEFAULT_BY_SUBJECT[subjectKey];
}
