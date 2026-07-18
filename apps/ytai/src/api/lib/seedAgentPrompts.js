import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import { SUBJECTS } from './tutorSubject.js';
import { YEARS } from './year.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

// Idempotent boot seed. Inserts one row per (year, subject) using the
// on-disk defaults from `src/api/prompts/subjects/*.md`. ON CONFLICT DO
// NOTHING keeps admin edits intact across restarts — only missing rows
// get filled in. Runs once on server start.
export default async function seedAgentPrompts(log) {
  const defaults = Object.fromEntries(
    SUBJECTS.map((s) => [
      s,
      readFileSync(path.join(PROMPTS_DIR, `subjects/${s}.md`), 'utf8').trimEnd()
    ])
  );
  const rows = [];
  for (const year of YEARS) {
    for (const subject of SUBJECTS) {
      rows.push({ year, subject, content: defaults[subject] });
    }
  }
  try {
    await db()
      .insert(agentPrompt)
      .values(rows)
      .onConflictDoNothing({ target: [agentPrompt.year, agentPrompt.subject] });
  } catch (err) {
    log?.error({ err }, 'seedAgentPrompts failed');
  }
}
