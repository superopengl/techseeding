import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage } from "../db/schema.js";
import fs from "fs/promises";
import path from "path";
import { eq, and } from "drizzle-orm";
import { ensureSandboxWorkDir } from "../lib/sandboxManager.js";
import { verifyToken } from "../lib/verifyToken.js";
import { runCraftTurn } from "../lib/sandboxAgent.js";
import { INDEX_FILE } from "../lib/sandboxTools.js";

const MAX_REQUESTS_PER_MINUTE = 30;
const HEARTBEAT_MS = 30_000;
const PROVIDER_ID = "deepseek";

function safeSend(socket, payload) {
  try { socket.send(JSON.stringify(payload)); } catch { /* socket gone */ }
}

function sendFatal(socket, message) {
  safeSend(socket, { type: "error", error: message });
  try { socket.close(); } catch { /* already closed */ }
}

async function lookupSandbox(sandboxId, userId) {
  const [record] = await db
    .select({ workDir: sandbox.workDir, indexHtmlContent: sandbox.indexHtmlContent })
    .from(sandbox)
    .where(and(eq(sandbox.id, sandboxId), eq(sandbox.userId, userId)));
  return record || null;
}

// Re-serialize the accumulated streaming parts of a message into the same
// `{text, parts}` jsonb shape the legacy persister wrote. Keeping the shape
// identical means historical messages and freshly-streamed ones render through
// the same client-side `entryFromPersistedMessage` path.
function serializeParts(partsMap) {
  const text = [];
  const parts = [];
  for (const part of partsMap.values()) {
    if (part.type === "text" && typeof part.text === "string") {
      text.push(part.text);
      parts.push({ id: part.id, type: "text", text: part.text });
    } else if (part.type === "reasoning" && typeof part.text === "string") {
      parts.push({ id: part.id, type: "reasoning", text: part.text });
    } else if (part.type === "tool") {
      parts.push({
        id: part.id,
        type: "tool",
        tool: part.tool,
        state: part.state ? { status: part.state.status } : undefined,
      });
    }
  }
  return { text: text.join(""), parts };
}

function createRateLimiter(maxPerMinute) {
  const timestamps = [];
  return function tryAcquire() {
    const now = Date.now();
    while (timestamps.length > 0 && now - timestamps[0] > 60_000) {
      timestamps.shift();
    }
    if (timestamps.length >= maxPerMinute) return false;
    timestamps.push(now);
    return true;
  };
}

// Heartbeat detects half-open TCP / NAT timeouts: ping every interval, expect a
// pong before the next tick. Returns a stop fn.
function startHeartbeat(socket, log, sandboxId) {
  let alive = true;
  socket.on("pong", () => { alive = true; });
  const interval = setInterval(() => {
    if (!alive) {
      log.warn({ sandboxId }, "Chat WS heartbeat lost; terminating");
      try { socket.terminate(); } catch { /* already gone */ }
      return;
    }
    alive = false;
    try { socket.ping(); } catch { /* closed between checks */ }
  }, HEARTBEAT_MS);
  return () => clearInterval(interval);
}

// Wraps a fire-and-forget Drizzle insert so callers can persist without
// awaiting, and the connection can flush pending writes on close.
function createPersister(log, sandboxId) {
  const pending = new Set();
  function persist(values) {
    const promise = db
      .insert(sessionMessage)
      .values(values)
      .onConflictDoNothing({ target: sessionMessage.opencodeMessageId })
      .catch((err) => {
        log.error({ sandboxId, messageId: values.opencodeMessageId, err }, "Failed to persist session message");
      })
      .finally(() => pending.delete(promise));
    pending.add(promise);
  }
  async function flush() {
    await Promise.allSettled(pending);
    pending.clear();
  }
  return { persist, flush };
}

function sendUserBubble({ socket, sessionId, text, persist }) {
  const messageId = randomUUID();
  const partId = `${messageId}-text`;
  safeSend(socket, {
    type: "message",
    info: { id: messageId, role: "user", sessionID: sessionId, time: { created: Date.now() } },
  });
  safeSend(socket, {
    type: "part",
    part: { id: partId, messageID: messageId, type: "text", text },
  });
  persist({
    sandboxSessionId: sessionId,
    opencodeMessageId: messageId,
    opencodeSessionId: sessionId,
    type: "user",
    content: { text, parts: [{ id: partId, type: "text", text }] },
    contentLength: text.length,
  });
}

// One assistant message per turn — multi-step tool loops collapse into a single
// bubble. Streamed parts (text/reasoning/tool) accumulate against this id; the
// client replaces parts by id, so re-emitting the full current state on each
// delta is correct.
function createAssistantTurn({ socket, sessionId, modelId, persist }) {
  const messageId = randomUUID();
  const createdAt = Date.now();
  const parts = new Map(); // partId -> part
  // Streaming text/reasoning deltas accumulate by event id; the SDK emits
  // `{text,reasoning}-delta` events with the delta in `.delta` (sometimes
  // `.text`) and a stable `.id` linking back to a `{text,reasoning}-start`.
  const textBufs = new Map(); // eventId -> { type, text }
  // We track which tool a given input-stream id belongs to so we can re-emit
  // the right pill on each `tool-input-delta` (keeps the WS chatty during the
  // long write-input stream and pre-empts heartbeat termination).
  const toolNamesById = new Map(); // toolCallId -> toolName
  let streamError = null;

  function emitPart(id, type, fields) {
    const part = { id, messageID: messageId, type, ...fields };
    parts.set(id, part);
    safeSend(socket, { type: "part", part });
  }

  function upsertText(eventId, type, fullText) {
    emitPart(`${type}-${eventId}`, type, { text: fullText });
  }

  function upsertTool(toolCallId, toolName, status) {
    emitPart(`tool-${toolCallId}`, "tool", { tool: toolName, state: { status } });
  }

  function appendDelta(eventId, type, event) {
    const buf = textBufs.get(eventId) || { type, text: "" };
    const delta = typeof event.delta === "string" ? event.delta : (event.text ?? "");
    buf.text += delta;
    textBufs.set(eventId, buf);
    upsertText(eventId, type, buf.text);
  }

  function start() {
    safeSend(socket, {
      type: "message",
      info: {
        id: messageId,
        role: "assistant",
        sessionID: sessionId,
        time: { created: createdAt },
        providerID: PROVIDER_ID,
        modelID: modelId,
      },
    });
  }

  function handleEvent(event) {
    switch (event.type) {
      case "text-start":
        textBufs.set(event.id, { type: "text", text: "" });
        upsertText(event.id, "text", "");
        break;
      case "text-delta":
        appendDelta(event.id, "text", event);
        break;
      case "reasoning-start":
        textBufs.set(event.id, { type: "reasoning", text: "" });
        upsertText(event.id, "reasoning", "");
        break;
      case "reasoning-delta":
        appendDelta(event.id, "reasoning", event);
        break;
      case "tool-input-start":
        // Fires as soon as the model commits to a tool — well before the
        // input args have finished streaming. For `write` (which carries a
        // whole HTML doc), waiting for `tool-call` would delay the pill by
        // many seconds. The `id` here is the same value that arrives as
        // `toolCallId` on the later `tool-call` / `tool-result`, so upserting
        // by that id keeps every subsequent event hitting the same part.
        toolNamesById.set(event.id, event.toolName);
        upsertTool(event.id, event.toolName, "pending");
        break;
      case "tool-input-delta": {
        const toolName = toolNamesById.get(event.id);
        if (!toolName) break;
        // Re-emit the pending pill so the WS stays chatty during long input
        // streams — a 30-second silence trips heartbeat termination, and a
        // silent socket also gives the kid a "did it crash?" feeling. The
        // canonical iframe refresh comes from the tool's `execute` writing
        // the final content (which fires `file-changed` exactly once per
        // call).
        upsertTool(event.id, toolName, "pending");
        break;
      }
      case "tool-call":
        upsertTool(event.toolCallId, event.toolName, "pending");
        break;
      case "tool-result":
        upsertTool(event.toolCallId, event.toolName, "completed");
        break;
      case "tool-error":
        // The bubble UI renders "error" tool state with the same green check
        // as "completed" — a benign tool error like "string not found"
        // shouldn't show a red chip to a kid. Persist the status anyway so
        // reloads match the live view.
        upsertTool(event.toolCallId, event.toolName, "error");
        break;
      case "error":
        streamError = event.error;
        break;
      // text-end, reasoning-end, start, start-step, finish-step, finish,
      // source, file, tool-input-end — not needed for the bubble UI.
    }
  }

  function complete(usage = {}) {
    // Defensive fallback: if the turn produced no text and no tool parts,
    // the student-side bubble would be empty (reasoning is hidden) and the
    // turn would look like "no reply". Inject a short completion text so the
    // kid sees an acknowledgement. Reaching here means the stream drained
    // cleanly — errors bail out via the catch path before complete() runs.
    const hasVisibleOutput = Array.from(parts.values()).some(
      (p) => p.type === "text" || p.type === "tool"
    );
    if (!hasVisibleOutput) {
      const id = `text-${messageId}-fallback`;
      const part = { id, messageID: messageId, type: "text", text: "Done!" };
      parts.set(id, part);
      safeSend(socket, { type: "part", part });
    }
    const { text, parts: persistedParts } = serializeParts(parts);
    const tokens = {
      input: usage.inputTokens ?? 0,
      output: usage.outputTokens ?? 0,
      reasoning: usage.reasoningTokens ?? 0,
      cache: { read: usage.cachedInputTokens ?? 0, write: 0 },
    };
    safeSend(socket, {
      type: "message",
      info: {
        id: messageId,
        role: "assistant",
        sessionID: sessionId,
        time: { created: createdAt, completed: Date.now() },
        providerID: PROVIDER_ID,
        modelID: modelId,
        tokens,
      },
    });
    persist({
      sandboxSessionId: sessionId,
      opencodeMessageId: messageId,
      opencodeSessionId: sessionId,
      type: "assistant",
      content: { text, parts: persistedParts },
      contentLength: text.length,
      providerId: PROVIDER_ID,
      modelId,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      reasoningTokens: tokens.reasoning,
      cacheReadTokens: tokens.cache.read,
      cacheWriteTokens: tokens.cache.write,
      cost: "0",
    });
  }

  return { start, handleEvent, complete, getStreamError: () => streamError };
}

export function wsChat(fastify) {
  fastify.register(async function (fastify) {
    fastify.get("/api/ws", { websocket: true }, async (socket, req) => {
      const { sandboxId } = req.query;
      const log = fastify.log;

      const payload = verifyToken(req);
      if (!payload) return sendFatal(socket, "Authentication required.");
      if (!sandboxId) return sendFatal(socket, "No sandbox ID provided.");

      const record = await lookupSandbox(sandboxId, payload.userId);
      if (!record) return sendFatal(socket, "Sandbox not found.");

      const { workDir, isNew } = await ensureSandboxWorkDir(sandboxId, record.workDir);
      if (isNew && record.indexHtmlContent) {
        await fs.writeFile(path.join(workDir, INDEX_FILE), record.indexHtmlContent);
      }

      const [session] = await db
        .insert(sandboxSession)
        .values({ userId: payload.userId, sandboxId })
        .returning({ id: sandboxSession.id });

      safeSend(socket, { type: "starting" });

      const modelId = process.env.KPAI_SANDBOX_DEEPSEEK_MODEL || "deepseek-chat";
      // The model's view of the conversation. Ephemeral per WS connection —
      // historical messages from prior sessions are loaded by the client into
      // the visible chat from the DB, but the model starts fresh on each
      // connect (matches the prior opencode behavior, keeping token costs
      // predictable).
      const conversation = [];
      const tryAcquire = createRateLimiter(MAX_REQUESTS_PER_MINUTE);
      const { persist, flush } = createPersister(log, sandboxId);
      const stopHeartbeat = startHeartbeat(socket, log, sandboxId);

      let turnAbort = null;
      let turnInFlight = false;

      async function handleSend(text) {
        if (!tryAcquire()) {
          safeSend(socket, { type: "rate-limit" });
          return;
        }
        if (turnInFlight) {
          // Frontend disables the send button while busy; if a message still
          // arrives, drop it rather than interleave with the live turn.
          log.info({ sandboxId }, "Dropping send while turn in flight");
          return;
        }
        turnInFlight = true;

        sendUserBubble({ socket, sessionId: session.id, text, persist });
        conversation.push({ role: "user", content: text });

        const turn = createAssistantTurn({ socket, sessionId: session.id, modelId, persist });
        turn.start();

        turnAbort = new AbortController();
        try {
          const result = await runCraftTurn({
            workDir,
            messages: conversation,
            signal: turnAbort.signal,
            onCraftChanged: (content) => {
              safeSend(socket, { type: "file-changed", file: INDEX_FILE });
              db.update(sandbox)
                .set({ indexHtmlContent: content, updatedAt: new Date() })
                .where(eq(sandbox.id, sandboxId))
                .catch((err) => {
                  log.error({ sandboxId, err }, "Failed to persist index.html to database");
                });
            },
            onEvent: turn.handleEvent,
          });

          // `result.finalMessages` is the model's view; feed assistant+tool
          // turns back so the next request has full context.
          for (const m of result.finalMessages) {
            if (m.role === "assistant" || m.role === "tool") {
              conversation.push(m);
            }
          }
          turn.complete(result.usage);
        } catch (err) {
          if (err.name !== "AbortError") {
            log.error({ sandboxId, err: err.message }, "Agent turn failed");
            safeSend(socket, { type: "error", error: "The AI ran into a problem. Try again." });
          }
        } finally {
          const streamError = turn.getStreamError();
          if (streamError) {
            log.warn({ sandboxId, err: streamError?.message ?? String(streamError) }, "Stream emitted error event");
            safeSend(socket, { type: "session-error", error: "The AI had trouble finishing. Try again." });
          }
          turnAbort = null;
          turnInFlight = false;
          safeSend(socket, { type: "idle" });
        }
      }

      socket.on("message", (raw) => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch (err) {
          log.warn({ sandboxId, err }, "Discarded malformed chat message");
          return;
        }
        if (parsed.type !== "send") return;
        const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
        if (!text) return;
        handleSend(text).catch((err) => {
          log.error({ sandboxId, err }, "handleSend rejected");
        });
      });

      safeSend(socket, { type: "ready" });

      let cleanedUp = false;
      socket.on("close", async () => {
        if (cleanedUp) return;
        cleanedUp = true;
        try {
          stopHeartbeat();
          if (turnAbort) turnAbort.abort();
          await flush();
          await db.update(sandboxSession)
            .set({ closedAt: new Date() })
            .where(eq(sandboxSession.id, session.id))
            .catch((err) => {
              log.error({ sessionId: session.id, err }, "Failed to close sandbox session");
            });
        } catch (err) {
          log.error({ sandboxId, err }, "Error during chat session cleanup");
        }
      });
    });
  });
}
