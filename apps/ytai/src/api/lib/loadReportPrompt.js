import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq, isNull } from 'drizzle-orm';
import db from '../db/index.js';
import { agentPrompt } from '../db/schema.js';
import { REPORT_SCOPE, REPORT_BODY_KEY, REPORT_TITLE_KEY } from './agentPromptScope.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

function read(rel) {
  return readFileSync(path.join(PROMPTS_DIR, rel), 'utf8').trimEnd();
}

// On-disk defaults — the seed content, used as the fallback when a draft is
// missing so report generation never runs with a blank system prompt.
const DEFAULT_BODY = read('reports/body.md');
const DEFAULT_TITLE = read('reports/title.md');

// Substitute {{placeholder}} tokens (subjectLabel, timespan) in an editable
// report prompt with their runtime values. Unknown tokens are left intact so a
// stray brace in the admin's text doesn't vanish.
export function renderReportPrompt(template, vars) {
  return String(template ?? '').replace(/\{\{(\w+)\}\}/g, (m, key) =>
    key in vars ? vars[key] : m
  );
}

// Load the two admin-editable analysis-report prompts from their mutable DRAFT
// rows (version IS NULL), falling back to the on-disk defaults when a draft is
// missing. Read fresh on every generation so admin edits take effect on the
// next report without a restart. Unlike the tutor tiers these are used raw —
// there's no publish/refine step.
export default async function loadReportPrompt() {
  const rows = await db()
    .select({ scopeKey: agentPrompt.scopeKey, content: agentPrompt.content })
    .from(agentPrompt)
    .where(and(eq(agentPrompt.scope, REPORT_SCOPE), isNull(agentPrompt.version)));

  const pick = (key) => rows.find((r) => r.scopeKey === key)?.content;

  return {
    body: pick(REPORT_BODY_KEY) || DEFAULT_BODY,
    title: pick(REPORT_TITLE_KEY) || DEFAULT_TITLE
  };
}
