import { and, desc, eq } from 'drizzle-orm';
import db from '../db/index.js';
import { compositePrompt } from '../db/schema.js';
import loadAgentPrompt from './loadAgentPrompt.js';
import isSubject, { DEFAULT_SUBJECT } from './tutorSubject.js';
import { YEARS } from './year.js';

const DEFAULT_YEAR = YEARS[0];

// Compose the two editable tiers into the raw composite string, in the
// canonical global → subject_year order. Shared by the publish route (as the
// source it refines) and the runtime fallback below.
export async function composeRawPrompt(year, subject) {
  const { global, subjectYear } = await loadAgentPrompt(year, subject);
  return [global, subjectYear]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

// Runtime read for a tutor turn. Prefer the published, AI-refined composite so
// students get the polished prompt; fall back to the raw three-tier
// composition when nothing is published for this (subject, year) yet, so
// tutoring still works before an admin hits Publish.
export default async function loadCompositePrompt(year, subject) {
  const subjectKey = isSubject(subject) ? subject : DEFAULT_SUBJECT;
  const yearKey = YEARS.includes(year) ? year : DEFAULT_YEAR;

  // Rows are immutable + versioned — always read the highest version.
  const [row] = await db()
    .select({ content: compositePrompt.content })
    .from(compositePrompt)
    .where(
      and(eq(compositePrompt.subject, subjectKey), eq(compositePrompt.year, yearKey))
    )
    .orderBy(desc(compositePrompt.version))
    .limit(1);

  if (row?.content) return row.content;
  return composeRawPrompt(yearKey, subjectKey);
}
