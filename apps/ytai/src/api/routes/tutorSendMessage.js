import { and, asc, eq } from 'drizzle-orm';
import db from '../db/index.js';
import { sessionMessage, tutorSession } from '../db/schema.js';
import brainTools from '../lib/brainTools.js';
import buildUserMessageWithImages from '../lib/buildUserMessageWithImages.js';
import collectUsedColors from '../lib/collectUsedColors.js';
import loadActiveDoc from '../lib/loadActiveDoc.js';
import makeTutorTools from '../lib/makeTutorTools.js';
import createPhantomNarrationGate, {
  looksLikeAnnotationAnnouncement,
  sanitizeAssistantContentForBrain,
  stripPhantomAnnotationNarration
} from '../lib/phantomNarrationGate.js';
import { normaliseUsage, recordLlmUsageBatch, sumUsage } from '../lib/recordLlmUsage.js';
import resolveAnnotatedImage from '../lib/resolveAnnotatedImage.js';
import runBrainTurn from '../lib/runBrainTurn.js';
import { publish as publishSessionEvent } from '../lib/sessionEventBus.js';
import tutorPrompt, { DEFAULT_GUIDANCE_LEVEL, isGuidanceLevel } from '../lib/tutorPrompt.js';

const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

function brainConfig() {
  return {
    baseUrl: process.env.YTAI_OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
    apiKey: process.env.YTAI_OPENROUTER_API_KEY || '',
    model: process.env.YTAI_OPENROUTER_CHAT_MODEL || 'deepseek/deepseek-chat'
  };
}

export default function tutorSendMessage(fastify) {
  fastify.post('/api/tutor/:sessionId/message', async (request, reply) => {
    const { sessionId } = request.params;
    const userId = request.userId;
    const content = typeof request.body?.content === 'string' ? request.body.content.trim() : '';
    // Frontend hint: which page of the doc the student is currently
    // looking at. Passed into the prompt so Brain biases page-specific
    // lookups toward what the student is staring at. Optional.
    const viewingPage = Number.isInteger(request.body?.viewingPage)
      ? Math.max(1, request.body.viewingPage)
      : null;
    // Per-turn ephemeral canvas snapshot: { imageId, dataUrl } where the
    // dataUrl is a PNG of (photo + freehand strokes) the student drew on
    // the active page. Not persisted — these bytes substitute for the
    // original page in Brain's multimodal user message so Brain sees what
    // the student circled. Absent when the canvas is clean.
    const annotatedImageRaw = request.body?.annotatedImage;
    // Per-turn pacing dial. The student picks Guided / Balanced / Direct
    // in the chat-panel control; the frontend ships the active value on
    // every send. Anything missing or invalid falls back to the default,
    // matching how `tutorPrompt` handles a null value downstream.
    const requestedGuidance = request.body?.guidanceLevel;
    const guidanceLevel = isGuidanceLevel(requestedGuidance)
      ? requestedGuidance
      : DEFAULT_GUIDANCE_LEVEL;
    // Opaque per-tab id from the calling device — used to filter the
    // device's own NOTIFY echoes back to itself on the events stream.
    const senderClientId =
      typeof request.body?.clientId === 'string' && request.body.clientId.length > 0
        ? request.body.clientId
        : null;

    if (!content) {
      reply.code(400);
      return { error: 'content is required' };
    }

    const [session] = await db()
      .select({
        id: tutorSession.id,
        currentDocId: tutorSession.currentDocId,
        subject: tutorSession.subject,
        year: tutorSession.year
      })
      .from(tutorSession)
      .where(and(eq(tutorSession.id, sessionId), eq(tutorSession.userId, userId)));

    if (!session) {
      reply.code(404);
      return { error: 'Session not found' };
    }

    const activeDoc = await loadActiveDoc(session.currentDocId);

    const { annotatedByImageId, annotatedPageNumbers } = resolveAnnotatedImage({
      annotatedImageRaw,
      activeDoc,
      log: request.log,
      sessionId
    });

    request.log.info(
      {
        sessionId,
        currentDocId: session.currentDocId,
        pageCount: activeDoc?.pages.length ?? 0,
        viewingPage,
        annotatedPages: Array.from(annotatedByImageId.keys())
      },
      'turn start'
    );

    const history = await db()
      .select({
        role: sessionMessage.role,
        content: sessionMessage.content,
        toolCalls: sessionMessage.toolCalls
      })
      .from(sessionMessage)
      .where(eq(sessionMessage.sessionId, sessionId))
      .orderBy(asc(sessionMessage.createdAt));

    // Colors Brain has already used for draw_annotation this session. We feed
    // these back to it via the system prompt so it can pick a fresh palette
    // entry on the next mark.
    const usedColors = collectUsedColors(history);
    const usedColorsForTurn = new Set(usedColors);

    const [userRow] = await db()
      .insert(sessionMessage)
      .values({
        sessionId,
        role: 'user',
        content,
        imageId: null,
        guidanceLevel
      })
      .returning({ id: sessionMessage.id, createdAt: sessionMessage.createdAt });

    // Tell other devices about the new user message right away — they
    // shouldn't have to wait until Brain finishes streaming to see the
    // question appear on their screen.
    publishSessionEvent(
      sessionId,
      'message:new',
      { role: 'user', messageId: userRow.id, senderClientId },
      request.log
    );

    const { systemMessages: promptMessages, turnPrompt } = await tutorPrompt({
      activeDoc,
      viewingPage,
      usedColors,
      guidanceLevel,
      subject: session.subject,
      year: session.year,
      annotatedPages: annotatedPageNumbers
    });

    // The latest user message carries every page of the active doc as
    // multimodal content so Brain can read the worksheet directly. Earlier
    // turns stay text-only — Brain sees the worksheet fresh each turn, and
    // prior assistant replies just describe what was seen.
    let latestUserContent = content;
    if (activeDoc) {
      const multimodalContent = await buildUserMessageWithImages({
        activeDoc,
        annotatedByImageId,
        text: content,
        log: request.log
      });
      if (multimodalContent) {
        latestUserContent = multimodalContent;
      } else {
        request.log.warn(
          { sessionId, activeDocId: activeDoc.id },
          'no page bytes resolvable — falling back to text-only user message'
        );
      }
    }

    const modelMessages = [
      ...promptMessages,
      // Skip empty-content rows: those are image-attachment markers for the
      // UI (legacy single-image sessions), not anything Brain needs in its
      // conversational context. For prior assistant turns, strip phantom-
      // highlight narration that wasn't backed by a real draw_annotation
      // call — otherwise the lie compounds across turns as Brain treats
      // its own past hallucinations as a template.
      ...history
        .map((m) => {
          if (m.role === 'assistant') {
            return { role: m.role, content: sanitizeAssistantContentForBrain(m) };
          }
          return { role: m.role, content: m.content };
        })
        .filter((m) => m.content),
      // Per-turn signals (viewing page, freehand marks this turn, used
      // colors, pacing rule) ride here — right after history, right before
      // the current user message — so the long static prefix above stays
      // byte-identical across turns and providers can hit their prompt
      // cache. The pacing line at the bottom of this block forces the
      // current reply to match the dropdown's current value regardless of
      // the pattern set by prior assistant turns.
      turnPrompt,
      { role: 'user', content: latestUserContent }
    ];

    const { baseUrl, apiKey, model: modelId } = brainConfig();

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    let clientClosed = false;
    function sse(event, data) {
      if (clientClosed) return;
      try {
        raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        clientClosed = true;
      }
    }

    sse('user', {
      id: userRow.id,
      role: 'user',
      content,
      imageId: null,
      guidanceLevel,
      createdAt: userRow.createdAt
    });

    const abortController = new AbortController();
    request.raw.on('close', () => {
      clientClosed = true;
      abortController.abort();
    });

    const dispatchTool = makeTutorTools({
      activeDoc,
      viewingPage,
      log: request.log,
      emit: sse,
      usedColorsForTurn
    });

    // Sentence-buffered gate around Brain's streamed text. Holds any
    // annotation-narration sentence ("I've put a yellow highlight on
    // question 5…") until draw_annotation surfaces on the wire. If the
    // tool call never fires, the phantom sentence is dropped before it
    // ever reaches the client — so the chat bubble and TTS never speak
    // a claim Brain didn't back up with a real mark. The post-stream
    // scrub below still runs for the persisted assistantContent, so the
    // saved transcript matches what the student saw.
    const narrationGate = createPhantomNarrationGate({
      emit: (delta) => sse('token', { delta })
    });

    let {
      assistantContent,
      allToolCalls,
      usageRecords,
      interrupted,
      error: turnError,
      // Diagnostic flags surfaced when assistantContent ends up empty —
      // logged below so we can tell apart "Brain returned nothing" from
      // "Brain replied and the phantom scrub stripped it".
      emptyStopRecovery,
      forceTextOnly,
      hitRoundCap,
      rounds
    } = await runBrainTurn({
      baseUrl,
      apiKey,
      model: modelId,
      messages: modelMessages,
      tools: activeDoc ? brainTools : undefined,
      signal: abortController.signal,
      log: request.log,
      logFields: { sessionId },
      dispatchTool,
      onToken: (delta) => narrationGate.pushToken(delta),
      onToolCall: (name) => {
        if (name === 'draw_annotation') narrationGate.markDrawAnnotation();
      },
      // Sticky-routing key: every turn in one tutor session ships the same
      // identifier so the upstream provider can route to the same shard and
      // hit its prefix cache.
      user: sessionId
    });

    narrationGate.finish();

    if (turnError) {
      request.log.error({ err: turnError, sessionId }, 'Chat stream failed');
    }

    // Phantom-annotation scrub: when Brain wrote "I've highlighted X in
    // yellow…" but never called draw_annotation, drop the offending
    // sentence before persisting so the transcript stays clean. The
    // student briefly hears the phantom claim via TTS — accepted as a
    // small audio glitch. A previous version re-ran Brain in-place
    // ("retry" SSE event) to fix this, but that mid-stream reverted the
    // bubble and cut TTS, which read worse than the rare narration glitch
    // it tried to avoid. May empty the message entirely if the entire
    // reply was the false claim — handled by the "no content" branch
    // below.
    const finalDrewSomething = allToolCalls.some((c) => c.name === 'draw_annotation');
    // Preserved so the empty-content fallback log below can show what
    // Brain actually said before the phantom scrub erased it.
    const rawAssistantContent = assistantContent;
    let phantomScrubbed = false;
    let phantomScrubEmptied = false;
    if (!finalDrewSomething && looksLikeAnnotationAnnouncement(assistantContent)) {
      const scrubbed = stripPhantomAnnotationNarration(assistantContent);
      phantomScrubbed = true;
      phantomScrubEmptied = scrubbed.length === 0;
      request.log.warn(
        {
          sessionId,
          before: assistantContent.slice(0, 200),
          after: scrubbed.slice(0, 200),
          emptied: phantomScrubEmptied
        },
        'Phantom annotation narration survived retry — scrubbing sentence before persistence'
      );
      assistantContent = scrubbed;
    }

    // Roll Brain rounds into one bill for this assistant message. The
    // audit-table inserts happen after the row is created so every
    // llm_usage record has the right messageId FK.
    const brainNormalised = (usageRecords ?? []).map((r) => normaliseUsage(r.usage));
    const turnTotals = sumUsage(brainNormalised);

    // One log line per round, dumping the raw `usage` block the provider
    // returned. Lets us see exactly which cache / token fields the upstream
    // populated (or didn't) — invaluable when a model+provider combo
    // doesn't surface cache_* metrics through OpenRouter and the persisted
    // columns end up null. Keep at info level; volume is one line per
    // Brain round (typically 1, sometimes 2-3 with tool calls).
    for (const [round, rec] of (usageRecords ?? []).entries()) {
      request.log.info(
        {
          sessionId,
          model: modelId,
          modelVersion: rec.modelVersion,
          round,
          rawUsage: rec.usage
        },
        'Brain round upstream usage'
      );
    }

    try {
      const [assistantRow] = await db()
        .insert(sessionMessage)
        .values({
          sessionId,
          role: 'assistant',
          content: assistantContent,
          provider: 'openrouter',
          modelId,
          imageId: null,
          inputTokens: turnTotals.inputTokens || null,
          outputTokens: turnTotals.outputTokens || null,
          reasoningTokens: turnTotals.reasoningTokens || null,
          cacheReadTokens: turnTotals.cacheReadTokens || null,
          cacheWriteTokens: turnTotals.cacheWriteTokens || null,
          costUsd: turnTotals.costUsd,
          interrupted,
          toolCalls: allToolCalls.length > 0 ? allToolCalls : null
        })
        .returning({ id: sessionMessage.id, createdAt: sessionMessage.createdAt });

      // Best-effort audit log — one row per Brain round that hit the
      // network. Batched into a single INSERT so a multi-round turn is one
      // DB round-trip, not N+1.
      const auditRecords = (usageRecords ?? []).map((rec) => ({
        userId,
        sessionId,
        messageId: assistantRow.id,
        purpose: 'brain_chat',
        model: modelId,
        modelVersion: rec.modelVersion,
        usage: rec.usage
      }));
      recordLlmUsageBatch(auditRecords, request.log).catch((err) => {
        request.log.warn({ err: err?.message, sessionId }, 'recordLlmUsageBatch background job rejected');
      });

      // Notify the other devices that the assistant reply is committed.
      // We deliberately don't stream tokens cross-device in v1 — the
      // receiver just refetches and sees the finished reply land in one
      // go. Less bandwidth and no Stop-button semantics to coordinate.
      publishSessionEvent(
        sessionId,
        'message:new',
        { role: 'assistant', messageId: assistantRow.id, senderClientId },
        request.log
      );

      if (turnError) {
        sse('error', {
          error: turnError.message?.slice(0, 600) || 'The tutor lost its train of thought. Try again?'
        });
      } else if (!assistantContent && !interrupted) {
        // Catches both the round-cap-hit case and the case where Brain
        // emitted nothing even after forceTextOnly + emptyStopRecovery tried
        // to coax a reply out of it. Either way the student is staring at a
        // blank bubble — give them something useful instead.
        //
        // Dump enough state to tell the two failure modes apart on the
        // next bug report:
        //   - rawAssistantLen=0  → Brain genuinely returned nothing in any
        //     round (model refusal, upstream stall, or the recovery
        //     reminder failed). `emptyStopRecovery`/`forceTextOnly`/
        //     `hitRoundCap` show which branches fired.
        //   - rawAssistantLen>0 + phantomScrubEmptied=true → Brain replied,
        //     but the entire reply was a phantom highlight claim and the
        //     scrub erased it. `rawAssistantPreview` shows what was said.
        request.log.warn(
          {
            sessionId,
            rounds,
            emptyStopRecovery,
            forceTextOnly,
            hitRoundCap,
            rawAssistantLen: rawAssistantContent.length,
            rawAssistantPreview: rawAssistantContent.slice(0, 300),
            phantomScrubbed,
            phantomScrubEmptied,
            drewAnnotation: finalDrewSomething,
            toolCallCount: allToolCalls.length,
            toolCallNames: allToolCalls.map((c) => c.name)
          },
          'Empty-content fallback firing — Brain produced no usable reply this turn'
        );
        sse('error', {
          error:
            "Hmm, I couldn't put together an answer for that one. Could you say a bit more about " +
            'what you want help with? (For example: which question, and what part is confusing.)'
        });
      } else {
        sse('done', {
          messageId: assistantRow.id,
          inputTokens: turnTotals.inputTokens || null,
          outputTokens: turnTotals.outputTokens || null,
          reasoningTokens: turnTotals.reasoningTokens || null,
          cacheReadTokens: turnTotals.cacheReadTokens || null,
          cacheWriteTokens: turnTotals.cacheWriteTokens || null,
          costUsd: turnTotals.costUsd,
          interrupted,
          // 'done' payload keeps its historical shape: only the UI-facing
          // draw_annotation calls. The full lookup chain lives in DB.
          toolCalls: allToolCalls.filter((c) => c.name === 'draw_annotation'),
          createdAt: assistantRow.createdAt
        });
      }
    } catch (err) {
      request.log.error({ err, sessionId }, 'Failed to persist assistant message');
      sse('error', { error: 'Failed to save the reply.' });
    }

    if (!clientClosed) {
      try {
        raw.end();
      } catch {
        // socket already gone
      }
    }
  });
}
