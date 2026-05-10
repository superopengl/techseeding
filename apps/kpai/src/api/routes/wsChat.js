import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { createOpencodeClient } from "@opencode-ai/sdk";
import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage } from "../db/schema.js";
import fs from "fs";
import path from "path";
import { eq, and } from "drizzle-orm";
import { ensureSandboxWorkDir } from "../lib/sandboxManager.js";
import { verifyToken } from "../lib/verifyToken.js";

const STARTUP_TIMEOUT_MS = 30_000;
const MAX_REQUESTS_PER_MINUTE = 30;

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

function spawnOpencodeServer(workDir) {
  const indexHtmlPath = path.join(workDir, "index.html");
  return spawn("nono", [
    "run",
    "--silent",
    "--allow-cwd",
    "--profile", "opencode",
    "--write-file", indexHtmlPath,
    "--",
    "opencode", "serve",
    "--hostname", "127.0.0.1",
    "--port", "0",
  ], {
    cwd: workDir,
    env: {
      ...process.env,
      DEEPSEEK_API_KEY: process.env.KPAI_SANDBOX_DEEPSEEK_API_KEY,
    },
    stdio: ["ignore", "pipe", "pipe"],
    // Detached so the child becomes its own process group leader. We can then
    // kill the whole tree (`-pid`) on cleanup — a plain kill on `nono` alone
    // can leave grandchildren (the opencode server, any tools it forked)
    // running and slowly bleeding RSS across reconnects.
    detached: true,
  });
}

// Kill `child` and everything in its process group, then wait until exit fires
// (or the timeout elapses, in which case escalate to SIGKILL). Returns when the
// process is reaped or when we've given up. Resolving on confirmed exit is the
// only thing that lets us guarantee we aren't accumulating zombie opencode
// servers across auto-reconnects.
async function killChildAndWait(child, fastify, sandboxId) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  const exited = new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode) { resolve(); return; }
    child.once("exit", () => resolve());
  });
  // Negative pid = signal the entire process group. With detached:true above,
  // child.pid IS the pgid, so this catches nono + opencode + any descendants.
  const killGroup = (signal) => {
    try { process.kill(-child.pid, signal); }
    catch (err) {
      if (err.code !== "ESRCH") {
        fastify.log.warn({ sandboxId, signal, err: err.message }, "Process group kill failed; falling back to direct child kill");
        try { child.kill(signal); } catch { /* gone */ }
      }
    }
  };
  killGroup("SIGTERM");
  const termed = await Promise.race([
    exited.then(() => true),
    new Promise((r) => setTimeout(() => r(false), 3000)),
  ]);
  if (!termed) {
    fastify.log.warn({ sandboxId, pid: child.pid }, "opencode server ignored SIGTERM; sending SIGKILL");
    killGroup("SIGKILL");
    await Promise.race([
      exited,
      new Promise((r) => setTimeout(r, 2000)),
    ]);
  }
}

// opencode prints its bound URL on startup; we read whichever stream it lands on
// and resolve with the first http://127.0.0.1:<port> we see. We also keep
// streaming output to the logger after resolve so any later stderr is captured.
function waitForServerUrl(child, fastify, sandboxId) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let buffer = "";
    const onData = (chunk) => {
      const text = chunk.toString();
      buffer += text;
      if (!resolved) {
        const match = buffer.match(/https?:\/\/(?:127\.0\.0\.1|localhost):\d+/);
        if (match) {
          resolved = true;
          clearTimeout(timer);
          resolve(match[0]);
        }
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", (chunk) => {
      onData(chunk);
      fastify.log.warn({ sandboxId, stderr: chunk.toString().trim() }, "opencode serve stderr");
    });
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`opencode serve startup timed out after ${STARTUP_TIMEOUT_MS}ms; output: ${buffer.slice(0, 500)}`));
      }
    }, STARTUP_TIMEOUT_MS);
    child.once("exit", (code, signal) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        reject(new Error(`opencode serve exited before reporting URL (code=${code} signal=${signal}) output: ${buffer.slice(0, 500)}`));
      }
    });
  });
}

function watchIndexHtml(sandboxWorkDirPath, sandboxId, socket, fastify) {
  const indexPath = path.join(sandboxWorkDirPath, "index.html");
  let debounceTimer = null;
  const watcher = fs.watch(indexPath, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      safeSend(socket, { type: "file-changed", file: "index.html" });
      fs.promises.readFile(indexPath, "utf-8").then((content) =>
        db
          .update(sandbox)
          .set({ indexHtmlContent: content, updatedAt: new Date() })
          .where(eq(sandbox.id, sandboxId))
      ).catch((err) => {
        fastify.log.error({ sandboxId, err }, "Failed to persist index.html to database");
      });
    }, 300);
  });
  return () => { watcher.close(); clearTimeout(debounceTimer); };
}

// Build the persisted text for a message by concatenating its text parts in
// the order they were tracked. Used for `content_length` and the legacy
// `content.text` field that the admin review UI reads.
function collectText(parts) {
  const out = [];
  for (const part of parts.values()) {
    if (part.type === "text" && typeof part.text === "string") out.push(part.text);
  }
  return out.join("");
}

// Slim down stream parts to a stable, minimal shape suitable for re-rendering
// on history reload. Keep text/reasoning text and tool name+state; drop
// bookkeeping parts (step-start/finish, snapshot, etc.) that the bubble UI
// already filters out. Insertion order is preserved by the Map.
function persistableParts(parts) {
  const out = [];
  for (const part of parts.values()) {
    if (!part?.type) continue;
    if (part.synthetic || part.ignored) continue;
    if (part.type === "text" || part.type === "reasoning") {
      if (typeof part.text === "string" && part.text.length > 0) {
        out.push({ id: part.id, type: part.type, text: part.text });
      }
    } else if (part.type === "tool") {
      out.push({
        id: part.id,
        type: "tool",
        tool: part.tool,
        // state can carry large file contents in input/output; keep only the
        // status so chips re-render with the right icon and color. Storing the
        // full state on every tool call would bloat session_message rows.
        state: part.state ? { status: part.state.status } : undefined,
      });
    }
  }
  return out;
}

export function wsChat(fastify) {
  fastify.register(async function (fastify) {
    fastify.get("/api/ws", { websocket: true }, async (socket, req) => {
      const { sandboxId } = req.query;

      const payload = verifyToken(req);
      if (!payload) return sendFatal(socket, "Authentication required.");
      if (!sandboxId) return sendFatal(socket, "No sandbox ID provided.");

      const record = await lookupSandbox(sandboxId, payload.userId);
      if (!record) return sendFatal(socket, "Sandbox not found.");

      const { workDir: sandboxWorkDir, isNew } = await ensureSandboxWorkDir(sandboxId, record.workDir);
      if (isNew && record.indexHtmlContent) {
        fs.writeFileSync(path.join(sandboxWorkDir, "index.html"), record.indexHtmlContent);
      }

      const [session] = await db
        .insert(sandboxSession)
        .values({ userId: payload.userId, sandboxId })
        .returning({ id: sandboxSession.id });

      safeSend(socket, { type: "starting" });

      // ---- spawn opencode server (per-sandbox, nono-jailed) ----
      let child;
      let baseUrl;
      try {
        child = spawnOpencodeServer(sandboxWorkDir);
        baseUrl = await waitForServerUrl(child, fastify, sandboxId);
      } catch (err) {
        fastify.log.error({ sandboxId, err: err.message }, "Failed to start opencode server");
        sendFatal(socket, "Failed to start AI assistant.");
        if (child) await killChildAndWait(child, fastify, sandboxId);
        return;
      }

      const client = createOpencodeClient({ baseUrl });

      // ---- create session ----
      // Pass directory explicitly so opencode binds the session to our sandbox
      // workdir even though we already started the server with that cwd.
      let openSessionId;
      try {
        const created = await client.session.create({ query: { directory: sandboxWorkDir } });
        openSessionId = created.data?.id ?? created.id;
        if (!openSessionId) throw new Error("session.create returned no id");
      } catch (err) {
        fastify.log.error({ sandboxId, err: err.message }, "Failed to create opencode session");
        sendFatal(socket, "Failed to start AI assistant session.");
        await killChildAndWait(child, fastify, sandboxId);
        return;
      }

      const cleanupIndexFileWatch = watchIndexHtml(sandboxWorkDir, sandboxId, socket, fastify);

      // ---- in-memory parts per message, used to assemble final text on persist ----
      const messagePartsById = new Map(); // messageID -> Map<partID, part>
      const persistedMessageIds = new Set();
      const pendingDbWrites = new Set();
      // Opencode's own user message ids — we synthesize and persist user
      // messages ourselves on send (so reload always has them), then suppress
      // opencode's parallel user.updated / user-text part.updated events to
      // avoid double-rendered user bubbles or duplicate inserts.
      const opencodeUserMessageIds = new Set();

      function persistMessage(info) {
        if (!info?.id || persistedMessageIds.has(info.id)) return;
        if (info.role !== "user" && info.role !== "assistant") return;
        if (info.role === "assistant" && !info.time?.completed) return;
        persistedMessageIds.add(info.id);

        const parts = messagePartsById.get(info.id) ?? new Map();
        const text = collectText(parts);
        const persistedParts = persistableParts(parts);
        const tokens = info.tokens || {};
        const cache = tokens.cache || {};
        const insert = db
          .insert(sessionMessage)
          .values({
            sandboxSessionId: session.id,
            opencodeMessageId: info.id,
            opencodeSessionId: info.sessionID ?? openSessionId,
            type: info.role,
            // `text` stays for back-compat with the admin review UI; `parts`
            // carries the structured stream so reload can replay reasoning
            // panels and tool chips, not just plain text.
            content: { text, parts: persistedParts },
            contentLength: text.length,
            providerId: info.providerID ?? null,
            modelId: info.modelID ?? null,
            inputTokens: tokens.input ?? 0,
            outputTokens: tokens.output ?? 0,
            reasoningTokens: tokens.reasoning ?? 0,
            cacheReadTokens: cache.read ?? 0,
            cacheWriteTokens: cache.write ?? 0,
            cost: info.cost != null ? String(info.cost) : "0",
          })
          .onConflictDoNothing({ target: sessionMessage.opencodeMessageId })
          .catch((err) => {
            fastify.log.error({ sandboxId, messageId: info.id, err }, "Failed to persist session message");
          })
          .finally(() => pendingDbWrites.delete(insert));
        pendingDbWrites.add(insert);
      }

      // ---- subscribe to events and forward ----
      const eventAbort = new AbortController();
      let eventLoopDone = null;
      try {
        // /global/event wraps each event with the directory it occurred in;
        // /event yielded nothing in our setup with no directory query, so we
        // use /global/event and unwrap.
        const evtRes = await client.global.event({ signal: eventAbort.signal });
        eventLoopDone = (async () => {
          try {
            for await (const wrapper of evtRes.stream) {
              const ev = wrapper?.payload ?? wrapper;
              if (!ev?.type) continue;

              if (ev.type === "message.updated") {
                const info = ev.properties?.info;
                if (!info) continue;
                if (info.sessionID && info.sessionID !== openSessionId) continue;
                // We synthesize and persist user messages ourselves on send;
                // remember the opencode-side id so we can suppress its
                // associated part events too.
                if (info.role === "user") {
                  opencodeUserMessageIds.add(info.id);
                  continue;
                }
                safeSend(socket, { type: "message", info });
                persistMessage(info);
              } else if (ev.type === "message.part.updated") {
                const part = ev.properties?.part;
                if (!part?.messageID) continue;
                if (opencodeUserMessageIds.has(part.messageID)) continue;
                let parts = messagePartsById.get(part.messageID);
                if (!parts) {
                  parts = new Map();
                  messagePartsById.set(part.messageID, parts);
                }
                parts.set(part.id, part);
                safeSend(socket, { type: "part", part });
              } else if (ev.type === "message.part.removed") {
                const { messageID, partID } = ev.properties ?? {};
                if (opencodeUserMessageIds.has(messageID)) continue;
                messagePartsById.get(messageID)?.delete(partID);
                safeSend(socket, { type: "part-removed", messageID, partID });
              } else if (ev.type === "session.idle") {
                safeSend(socket, { type: "idle" });
              } else if (ev.type === "session.error") {
                safeSend(socket, { type: "session-error", error: ev.properties?.error?.message ?? "Session error" });
              } else if (ev.type === "permission.updated") {
                // Anything that surfaces as an "ask" is something opencode.json
                // didn't pre-approve. For a kids' sandbox we always reject — never
                // hang waiting for a human approver and never silently widen the
                // tool surface.
                const perm = ev.properties;
                if (perm?.id && perm?.sessionID === openSessionId) {
                  client.postSessionIdPermissionsPermissionId({
                    path: { id: perm.sessionID, permissionID: perm.id },
                    body: { response: "reject" },
                  }).catch((err) => {
                    fastify.log.error({ sandboxId, permissionId: perm.id, err: err.message }, "Failed to reject permission");
                  });
                }
              }
            }
          } catch (err) {
            if (err.name !== "AbortError") {
              fastify.log.error({ sandboxId, err: err.message }, "Event stream error");
            }
          }
        })();
      } catch (err) {
        fastify.log.error({ sandboxId, err: err.message }, "Failed to open event stream");
        sendFatal(socket, "Failed to subscribe to AI events.");
        await killChildAndWait(child, fastify, sandboxId);
        return;
      }

      // ---- rate limiting ----
      const requestTimestamps = [];
      function checkRateLimit() {
        const now = Date.now();
        while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60_000) {
          requestTimestamps.shift();
        }
        if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) return false;
        requestTimestamps.push(now);
        return true;
      }

      // ---- heartbeat: detect half-open TCP / NAT timeouts ----
      let alive = true;
      socket.on("pong", () => { alive = true; });
      const heartbeat = setInterval(() => {
        if (!alive) {
          fastify.log.warn({ sandboxId }, "Chat WS heartbeat lost; terminating");
          try { socket.terminate(); } catch { /* already gone */ }
          return;
        }
        alive = false;
        try { socket.ping(); } catch { /* socket closed between checks */ }
      }, 30_000);

      // ---- inbound user messages ----
      // Register the handler BEFORE sending "ready" so a user-side click that
      // races the ready event isn't silently dropped (Node EventEmitter has no
      // queueing for events fired before any listener is attached).
      socket.on("message", async (raw) => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch (err) {
          fastify.log.warn({ sandboxId, err }, "Discarded malformed chat message");
          return;
        }
        if (parsed.type !== "send") return;
        const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
        if (!text) return;
        if (!checkRateLimit()) {
          safeSend(socket, { type: "rate-limit" });
          return;
        }
        // Synthesize and persist the user message immediately. Opencode's own
        // user message events sometimes arrive without text (the prompt body
        // carries it, but no message.part.updated follows), so we own the
        // user-side rendering and persistence end to end.
        const userMessageId = randomUUID();
        const partId = `${userMessageId}-text`;
        const userInfo = {
          id: userMessageId,
          role: "user",
          sessionID: openSessionId,
          time: { created: Date.now() },
        };
        const userPart = { id: partId, messageID: userMessageId, type: "text", text };
        safeSend(socket, { type: "message", info: userInfo });
        safeSend(socket, { type: "part", part: userPart });

        persistedMessageIds.add(userMessageId);
        // Await the insert directly so the DB row is guaranteed to exist
        // before we hand off to opencode. Drizzle builders are thenable but
        // chaining `.catch()` was leaving us uncertain whether the SQL was
        // actually fired in every code path; awaiting removes the ambiguity.
        try {
          await db
            .insert(sessionMessage)
            .values({
              sandboxSessionId: session.id,
              opencodeMessageId: userMessageId,
              opencodeSessionId: openSessionId,
              type: "user",
              content: { text, parts: [{ id: partId, type: "text", text }] },
              contentLength: text.length,
            })
            .onConflictDoNothing({ target: sessionMessage.opencodeMessageId });
          fastify.log.info({ sandboxId, messageId: userMessageId, len: text.length }, "Persisted user message");
        } catch (err) {
          fastify.log.error({ sandboxId, messageId: userMessageId, err: err.message }, "Failed to persist user message");
        }

        try {
          // Async variant returns immediately; the assistant response streams
          // back via the event subscription, so we don't tie up the WS handler
          // for the duration of the model call.
          await client.session.promptAsync({
            path: { id: openSessionId },
            query: { directory: sandboxWorkDir },
            body: {
              parts: [{ type: "text", text }],
              model: { providerID: "deepseek", modelID: "deepseek-v4-flash" },
            },
          });
        } catch (err) {
          fastify.log.error({ sandboxId, err: err.message }, "session.promptAsync failed");
          safeSend(socket, { type: "error", error: "Failed to send message." });
        }
      });

      // ---- child exit handling ----
      child.once("exit", (code, signal) => {
        if (code !== 0 && code !== null) {
          fastify.log.error({ sandboxId, code, signal }, "opencode server exited unexpectedly");
        }
        try { socket.close(); } catch { /* already closed */ }
      });

      // Handler is now registered above — safe to tell the client the session
      // is live. The frontend gates input on this signal.
      safeSend(socket, { type: "ready" });

      // ---- cleanup on close ----
      let cleanedUp = false;
      const cleanup = async () => {
        if (cleanedUp) return;
        cleanedUp = true;
        try {
          clearInterval(heartbeat);
          cleanupIndexFileWatch();
          // Kill the server (and its whole process group) and WAIT for it to
          // actually exit before we consider this session cleaned up. Without
          // the await, an auto-reconnect spawns a new opencode while the
          // previous one is still draining — RSS climbs across reconnects.
          await killChildAndWait(child, fastify, sandboxId);
          eventAbort.abort();
          if (eventLoopDone) {
            await Promise.race([
              eventLoopDone.catch(() => {}),
              new Promise((r) => setTimeout(r, 2000)),
            ]);
          }
          // Drop our own per-session in-memory caches so the closure becomes
          // garbage-collectable promptly even if some external reference (e.g.
          // a still-resolving DB promise) outlives us.
          messagePartsById.clear();
          persistedMessageIds.clear();
          opencodeUserMessageIds.clear();
          await Promise.allSettled(pendingDbWrites);
          pendingDbWrites.clear();
          await db.update(sandboxSession)
            .set({ closedAt: new Date() })
            .where(eq(sandboxSession.id, session.id))
            .catch((err) => {
              fastify.log.error({ sessionId: session.id, err }, "Failed to close sandbox session");
            });
        } catch (err) {
          fastify.log.error({ sandboxId, err }, "Error during chat session cleanup");
        }
      };
      socket.on("close", cleanup);
    });
  });
}
