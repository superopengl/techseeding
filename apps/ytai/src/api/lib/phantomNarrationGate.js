// Catches first-person claims of having drawn on the page. Used to detect
// the hallucination case where Brain narrates a highlight it never actually
// produced via draw_annotation. Intentionally first-person ("I've") only —
// "the student highlighted" or "the page has a circle around" are legitimate
// descriptions of someone else's marks.
// Shapes Brain's draw_annotation can produce ("rect" most often surfaces as
// rectangle/square/outline/frame/box in the narration). Kept in one list so
// both the verb-only branch ("I've boxed…") and the "put a <color> <shape>"
// branch stay in sync.
const ANNOTATION_SHAPE = '(?:highlight|circle|box|mark|rectangle|square|outline|frame)';
const ANNOTATION_NARRATION_RE = new RegExp(
  `\\bI(?:'ve| have| 've)?\\s+(?:just|now|already)?\\s*(?:` +
    // "put a purple rectangle around …", "put an orange highlight on …"
    `put\\s+(?:a|an)\\s+\\w+\\s+${ANNOTATION_SHAPE}` +
    // Bare verb forms — "highlighted", "circled", "boxed", "outlined", …
    `|highlighted|circled|underlined|outlined|boxed|marked` +
    // "drew/drawn a rectangle around …"
    `|(?:drew|drawn|draw)\\s+(?:a\\s+)?${ANNOTATION_SHAPE}` +
  `)\\b`,
  'i'
);

export function looksLikeAnnotationAnnouncement(text) {
  if (typeof text !== 'string' || text.length === 0) return false;
  return ANNOTATION_NARRATION_RE.test(text);
}

// Strip every phantom-highlight sentence from a string, splitting on
// sentence terminators and newlines and dropping any segment that matches
// the narration regex. Used both for cleaning past assistant messages
// before re-feeding Brain (so the lie doesn't reinforce itself across
// turns) and as a belt-and-suspenders scrub on the live turn's content
// before it lands in the DB. May return an empty string if the entire
// message was the false claim.
export function stripPhantomAnnotationNarration(content) {
  if (typeof content !== 'string' || content.length === 0) return content;
  if (!ANNOTATION_NARRATION_RE.test(content)) return content;
  return content
    .split(/(?<=[.!?])\s+|\n+/)
    .filter((s) => !ANNOTATION_NARRATION_RE.test(s))
    .join(' ')
    .trim();
}

// Scrub phantom-highlight narration off an assistant row before feeding
// it back to Brain. Skipped when the row actually had a draw_annotation
// call (the narration was grounded), so legitimate "I've highlighted X"
// sentences stay intact.
export function sanitizeAssistantContentForBrain(row) {
  const content = typeof row.content === 'string' ? row.content : '';
  if (!content) return content;
  const hadDrawAnnotation =
    Array.isArray(row.toolCalls) && row.toolCalls.some((c) => c?.name === 'draw_annotation');
  if (hadDrawAnnotation) return content;
  return stripPhantomAnnotationNarration(content);
}

// Sentence boundary in a streaming buffer: `.!?` followed by whitespace or
// end-of-buffer, OR a bare newline. Returns the index *after* the boundary
// (i.e. where the next sentence begins) or -1 if there's no complete
// sentence yet.
function findSentenceBoundary(buffer) {
  const m = /[.!?](?=\s)|\n/.exec(buffer);
  return m ? m.index + m[0].length : -1;
}

// Token gate that buffers Brain's streamed text and only releases it to
// the client once we know whether the annotation announcement (if any)
// has a real draw_annotation tool call behind it. Sentence-buffered:
// each completed sentence is checked against the phantom-narration
// regex; if it matches and no draw_annotation has fired this turn,
// we hold ALL subsequent text until the verdict lands. Order is
// preserved — we never emit later sentences ahead of held earlier ones.
//
// Verdict flows:
//   - draw_annotation tool call surfaces on the wire → markDrawAnnotation()
//     releases the held buffer in order, then passes through tokens.
//   - Stream ends without a draw_annotation call → finish() scrubs phantom
//     sentences from the held buffer and emits what's left.
//
// `drewAlready` seeds the flag from prior rounds in the same turn: once
// Brain has called draw_annotation in any round, every subsequent
// annotation narration in this turn is grounded and should pass straight
// through.
export default function createPhantomNarrationGate({ emit, drewAlready = false }) {
  let pending = '';
  let holding = false;
  let drawAnnotationSeen = drewAlready;

  function flushNow(text) {
    if (text) emit(text);
  }

  return {
    pushToken(delta) {
      if (!delta) return;
      pending += delta;
      // Drain whole sentences while we're not in HOLDING. Once we enter
      // HOLDING, every subsequent token joins `pending` and stays there
      // until the verdict releases it (or stream end scrubs it).
      while (!holding) {
        const end = findSentenceBoundary(pending);
        if (end < 0) break;
        const sentence = pending.slice(0, end);
        if (looksLikeAnnotationAnnouncement(sentence) && !drawAnnotationSeen) {
          holding = true;
          break;
        }
        flushNow(sentence);
        pending = pending.slice(end);
      }
    },
    markDrawAnnotation() {
      if (drawAnnotationSeen) return;
      drawAnnotationSeen = true;
      if (holding) {
        flushNow(pending);
        pending = '';
        holding = false;
      }
    },
    finish() {
      if (!pending) return;
      // If we were holding (phantom detected without a tool call), or the
      // tail buffer itself is a partial phantom sentence with no terminator
      // yet, scrub before flushing. Otherwise just flush the tail as-is.
      const needsScrub =
        holding || (!drawAnnotationSeen && looksLikeAnnotationAnnouncement(pending));
      if (needsScrub) {
        const scrubbed = stripPhantomAnnotationNarration(pending);
        flushNow(scrubbed);
      } else {
        flushNow(pending);
      }
      pending = '';
      holding = false;
    }
  };
}
