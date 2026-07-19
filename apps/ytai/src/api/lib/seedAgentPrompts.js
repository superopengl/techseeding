import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNull } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import { SUBJECTS } from './tutorSubject.js';
import { GLOBAL_KEY } from './agentPromptScope.js';
import { YEARS } from './year.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

function read(rel) {
  return readFileSync(path.join(PROMPTS_DIR, rel), 'utf8').trimEnd();
}

// Idempotent boot seed. Ensures each tier has a mutable DRAFT row (version
// NULL) seeded from the on-disk defaults (prompts/tutorPersona.md,
// prompts/subjects/*.md, prompts/years/*.md). Only missing drafts are
// inserted — existing drafts (which the editor mutates) and any published
// versions are left untouched. Runs once on server start.
export default async function seedAgentPrompts(log) {
  const wanted = [
    { scope: 'global', scopeKey: GLOBAL_KEY, version: null, content: read('tutorPersona.md') },
    ...SUBJECTS.map((s) => ({
      scope: 'subject',
      scopeKey: s,
      version: null,
      content: read(`subjects/${s}.md`)
    })),
    ...YEARS.map((y) => ({
      scope: 'year',
      scopeKey: y,
      version: null,
      content: read(`years/${y}.md`)
    }))
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
