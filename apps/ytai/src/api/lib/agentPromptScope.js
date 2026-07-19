import { SUBJECTS } from './tutorSubject.js';
import { YEARS } from './year.js';

// Admin-editable prompt scopes. Two feed the tutor: a single GLOBAL prompt
// (agent role + product scope) and one SUBJECT_YEAR prompt per (subject, year)
// cell — the tutor turn injects global + subject_year (published/refined into a
// composite). The REPORT scope feeds the analysis-report generator: two prompts
// (body + title) edited as raw drafts and read directly at generation time — no
// publish/refine step, unlike the tutor tiers.
export const PROMPT_SCOPES = Object.freeze(['global', 'subject_year', 'report']);

// The single global row keys itself with this sentinel.
export const GLOBAL_KEY = 'global';

// The two analysis-report prompts, both under the 'report' scope: BODY is the
// system prompt for the main report generation; TITLE is the system prompt for
// the short report-name pass.
export const REPORT_SCOPE = 'report';
export const REPORT_BODY_KEY = 'body';
export const REPORT_TITLE_KEY = 'title';
export const REPORT_KEYS = Object.freeze([REPORT_BODY_KEY, REPORT_TITLE_KEY]);

// Composite key for a (subject, year) cell, e.g. "math:Y3".
export function subjectYearKey(subject, year) {
  return `${subject}:${year}`;
}

// Valid keys for a given scope: the global sentinel, every subject×year cell
// key, or the two report keys. Drives admin-write validation and boot seeding.
export function scopeKeysFor(scope) {
  if (scope === 'global') return [GLOBAL_KEY];
  if (scope === 'subject_year') {
    return SUBJECTS.flatMap((s) => YEARS.map((y) => subjectYearKey(s, y)));
  }
  if (scope === REPORT_SCOPE) return [...REPORT_KEYS];
  return [];
}

// True iff (scope, key) names a real prompt cell the admin may write.
export default function isValidScopeKey(scope, key) {
  return PROMPT_SCOPES.includes(scope) && scopeKeysFor(scope).includes(key);
}
