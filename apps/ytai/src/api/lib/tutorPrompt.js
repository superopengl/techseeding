import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ANNOTATION_COLOR_NAMES } from './annotationPalette.js';
import loadCompositePrompt from './loadCompositePrompt.js';
import isSubject, { DEFAULT_SUBJECT } from './tutorSubject.js';
import { YEARS } from './year.js';

const PROMPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../prompts'
);

function loadPrompt(name) {
  return readFileSync(path.join(PROMPTS_DIR, name), 'utf8').trimEnd();
}

// Loaded once at module init — the pace files stay builtin. The editable
// system-prompt stack (global + subject + year) lives in the DB (see
// `loadAgentPrompt`), so admin edits to any tier take effect on the next
// tutor turn without a server restart.
const PACE_BY_LEVEL = {
  guided: loadPrompt('tutorPace.guided.md'),
  balanced: loadPrompt('tutorPace.balanced.md'),
  direct: loadPrompt('tutorPace.direct.md')
};
const DEFAULT_YEAR = YEARS[0];

export const GUIDANCE_LEVELS = Object.freeze(['guided', 'balanced', 'direct']);
export const DEFAULT_GUIDANCE_LEVEL = 'direct';

export function isGuidanceLevel(value) {
  return typeof value === 'string' && GUIDANCE_LEVELS.includes(value);
}

export default async function tutorPrompt({
  activeDoc,
  viewingPage,
  usedColors = [],
  guidanceLevel,
  subject,
  year,
  annotatedPages = []
} = {}) {
  const level = isGuidanceLevel(guidanceLevel) ? guidanceLevel : DEFAULT_GUIDANCE_LEVEL;
  const subjectKey = isSubject(subject) ? subject : DEFAULT_SUBJECT;
  const yearKey = YEARS.includes(year) ? year : DEFAULT_YEAR;
  const hasDoc = !!activeDoc && Array.isArray(activeDoc.pages) && activeDoc.pages.length > 0;

  // The composite system prompt is loaded from the DB on every turn so admin
  // edits take effect on the next message without a restart. It's the
  // published, AI-refined merge of the three editable tiers (global + subject
  // + year); when a (subject, year) hasn't been published yet the loader
  // falls back to composing those tiers live.
  const composite = await loadCompositePrompt(yearKey, subjectKey);

  // STATIC system messages — byte-identical across every turn in one
  // session (within a single active doc). This is the prefix we want
  // OpenRouter and the upstream provider to cache. Anything that varies
  // per turn — viewingPage, used colors, annotated pages, pacing — must
  // NOT live in here; it goes in `turnPrompt` below and ships AFTER
  // history so the long stable prefix stays cacheable.
  const messages = [{ role: 'system', content: composite }];

  if (hasDoc) {
    const pageCount = activeDoc.pages.length;
    messages.push({
      role: 'system',
      content:
        `The student is studying a ${pageCount}-page worksheet (the "current doc"). You can see ` +
        `every page directly — each page is attached as an image in the user message, labeled ` +
        `"Worksheet (page N of ${pageCount}):". Read the printed text, the student's handwriting, ` +
        `any diagrams, and any freehand marks the student drew, straight from the images.\n` +
        '\n' +
        'You have one tool:\n' +
        '\n' +
        `1. draw_annotation({ shape, x1, y1, x2, y2, page, color?, label? }) — draws on a specific ` +
        `page. Pass the \`page\` (1..${pageCount}) the bbox belongs to. Coordinates are normalized ` +
        `0..1 corners within that page (0,0 = top-left, 1,1 = bottom-right). Estimate the bbox ` +
        `from what you see in the image.\n` +
        '\n' +
        'The student can draw freehand on the page — colored circles, underlines, highlights — ' +
        'to point at what they are stuck on. Those marks are baked into the page image you see, ' +
        'so read them as the student pointing at exactly what they want help with.\n' +
        '\n' +
        'Annotation is the default — almost every turn that references the page should call ' +
        'draw_annotation. Skip it for general or off-page questions. Do not narrate a highlight ' +
        'unless you actually called draw_annotation.'
    });

    messages.push({
      role: 'system',
      content:
        'When you call draw_annotation:\n' +
        `- The full color palette is: ${ANNOTATION_COLOR_NAMES.join(', ')}.\n` +
        '- The per-turn context below tells you which colors are already used this session ' +
        'and which are still free. Pick a `color` from the AVAILABLE list so each mark stands ' +
        'apart from the previous ones. Only repeat a used color if every color has been used.\n' +
        '- Always provide a short `label` naming what you are pointing at (e.g. "Question 3", ' +
        '"the + sign", "wrong answer"). The student sees this caption beside the mark on the page.\n' +
        '- In the same message, include one short sentence telling the student which color you used ' +
        'and why, e.g. "I\'ve put a yellow highlight on question 3 so you can see what we\'re looking at." ' +
        'Keep it to a single sentence; do not list every previous color or apologize.'
    });
  } else {
    messages.push({
      role: 'system',
      content:
        'No worksheet has been uploaded yet. If the student asks about a worksheet, ' +
        'ask them kindly to upload a clear photo first.'
    });
  }

  // Cache breakpoint on the LAST static message — caches every system
  // message above it. Anthropic and OpenRouter-compatible backends honor
  // `cache_control: ephemeral` on the trailing content block; backends
  // that don't recognize it ignore the key. The content-array form is
  // the OpenRouter / Anthropic-compatible shape. LM Studio's KV cache
  // reuses matching prefixes on its own, so this is a no-op in dev.
  const lastStatic = messages[messages.length - 1];
  lastStatic.content = [
    { type: 'text', text: lastStatic.content, cache_control: { type: 'ephemeral' } }
  ];

  // PER-TURN system message — one block, shipped AFTER history and right
  // BEFORE the current user message. Bundles every signal that varies
  // turn-to-turn: which page the student is viewing, what they drew this
  // turn, which palette colors are still free, and the pacing rule for
  // this single turn. Keeping all of this out of the static prefix is
  // what makes prefix caching pay off.
  const turnSections = [];

  if (hasDoc) {
    const pageCount = activeDoc.pages.length;
    const viewing =
      Number.isInteger(viewingPage) && viewingPage >= 1 && viewingPage <= pageCount
        ? viewingPage
        : null;
    if (viewing) {
      turnSections.push(
        `The student is currently looking at page ${viewing}. Bias your attention toward ` +
          'that page unless the question clearly references a different one.'
      );
    }

    const annotatedList = Array.isArray(annotatedPages)
      ? annotatedPages.filter((n) => Number.isInteger(n) && n >= 1)
      : [];
    if (annotatedList.length > 0) {
      const pageList =
        annotatedList.length === 1
          ? `page ${annotatedList[0]}`
          : `pages ${annotatedList.join(', ')}`;
      turnSections.push(
        `Heads up: the student drew freehand on ${pageList} for THIS turn. Their mark is ` +
          'baked into the page image you can see — read what they circled or highlighted ' +
          'directly from the image. Do not tell the student you cannot see the mark. Then ' +
          'call draw_annotation to acknowledge it with your own bbox over the same region.'
      );
    }

    const usedSet = new Set(
      (Array.isArray(usedColors) ? usedColors : []).map((c) => String(c).toLowerCase())
    );
    const used = ANNOTATION_COLOR_NAMES.filter((c) => usedSet.has(c));
    const free = ANNOTATION_COLOR_NAMES.filter((c) => !usedSet.has(c));
    const usedList = used.length > 0 ? used.join(', ') : 'none yet';
    // When every palette color has been used in a long session, "free" is
    // empty — fall back to the full palette so Brain still has options
    // rather than picking nothing.
    const freeList = (free.length > 0 ? free : ANNOTATION_COLOR_NAMES).join(', ');
    turnSections.push(
      `Annotation colors used so far this session: ${usedList}.\n` +
        `Annotation colors still available: ${freeList}.`
    );
  }

  turnSections.push(
    'For this single turn, follow this pacing rule. It overrides any pacing implied by ' +
      'earlier assistant messages in this conversation.\n\n' +
      PACE_BY_LEVEL[level]
  );

  const turnPrompt = {
    role: 'system',
    content: turnSections.join('\n\n')
  };

  return { systemMessages: messages, turnPrompt };
}
