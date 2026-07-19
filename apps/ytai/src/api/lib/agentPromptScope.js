import { SUBJECTS } from './tutorSubject.js';
import { YEARS } from './year.js';

// The three admin-editable prompt tiers. The final system prompt injected on
// every tutor turn is composed in this order: global + subject + year.
export const PROMPT_SCOPES = Object.freeze(['global', 'subject', 'year']);

// The single global row keys itself with this sentinel so (scope, scope_key)
// stays a clean, non-null composite key across all three tiers.
export const GLOBAL_KEY = 'global';

// Valid keys for a given scope: the global sentinel, a subject value, or a
// school-year value. Drives both admin-write validation and boot seeding.
export function scopeKeysFor(scope) {
  if (scope === 'global') return [GLOBAL_KEY];
  if (scope === 'subject') return [...SUBJECTS];
  if (scope === 'year') return [...YEARS];
  return [];
}

// True iff (scope, key) names a real prompt row the admin is allowed to write.
export default function isValidScopeKey(scope, key) {
  return PROMPT_SCOPES.includes(scope) && scopeKeysFor(scope).includes(key);
}
