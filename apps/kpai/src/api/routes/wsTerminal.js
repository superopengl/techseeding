import pty from "node-pty";
import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage } from "../db/schema.js";
import fs from "fs";
import path from "path";
import { eq, and } from "drizzle-orm";
import { ensureSandboxWorkDir } from "../lib/sandboxManager.js";
import { verifyToken } from "../lib/verifyToken.js";

function sendError(socket, message) {
  socket.send(JSON.stringify({ type: "output", data: `\x1b[31mError: ${message}\x1b[0m\r\n` }));
  socket.close();
}

async function lookupSandbox(sandboxId, userId) {
  const [record] = await db
    .select({ workDir: sandbox.workDir, indexHtmlContent: sandbox.indexHtmlContent })
    .from(sandbox)
    .where(and(eq(sandbox.id, sandboxId), eq(sandbox.userId, userId)));
  return record || null;
}

const KPAI_DIR = ".kpai";
const USAGE_REL_PATH = `${KPAI_DIR}/usage.jsonl`;

function configureOpenCode(sandboxWorkDirPath) {
  fs.mkdirSync(path.join(sandboxWorkDirPath, KPAI_DIR), { recursive: true });
  // Pre-create the usage log so nono's --write-file rule attaches to a real path
  // and the parent watcher can fs.watch it without races.
  fs.writeFileSync(path.join(sandboxWorkDirPath, USAGE_REL_PATH), "", { flag: "a" });
}

function spawnTerminal(sandboxWorkDirPath) {
  // Use `nono run` (keeps nono as parent and forwards stdio) instead of `nono wrap`
  // (exec into command). On Linux/Landlock with nono v0.49, `wrap` swallows the
  // child's stdout under a PTY, so opencode's TUI never reaches the websocket.
  return pty.spawn("nono", [
    "run",
    "--silent",
    "--allow-cwd",
    "--profile", "opencode",
    "--write-file", path.join(sandboxWorkDirPath, "index.html"),
    "--write-file", path.join(sandboxWorkDirPath, USAGE_REL_PATH),
    "--", "opencode", ".",
  ], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: sandboxWorkDirPath,
    env: {
      ...process.env,
      DEEPSEEK_API_KEY: process.env.KPAI_SANDBOX_DEEPSEEK_API_KEY,
      // Activates the global kpai-usage opencode plugin (devops/opencode-config/plugins/),
      // which appends per-message token usage records to this file in cwd.
      KPAI_OPENCODE_TOKEN_USAGE_FILENAME: USAGE_REL_PATH,
    },
  });
}

function watchOpenCodeTokenUsage(sandboxWorkDirPath, sandboxId, sandboxSessionId, socket, fastify) {
  const usagePath = path.join(sandboxWorkDirPath, USAGE_REL_PATH);
  let offset = 0;
  let leftover = "";
  let reading = false;
  const pendingDbWrites = new Set();

  function persistRecord(record) {
    const tokens = record.tokens || {};
    const cache = tokens.cache || {};
    const text = record.text ?? "";
    const insert = db
      .insert(sessionMessage)
      .values({
        sandboxSessionId,
        opencodeMessageId: record.messageID,
        opencodeSessionId: record.sessionID,
        type: record.role,
        content: { text },
        contentLength: text.length,
        providerId: record.providerID ?? null,
        modelId: record.modelID ?? null,
        inputTokens: tokens.input ?? 0,
        outputTokens: tokens.output ?? 0,
        reasoningTokens: tokens.reasoning ?? 0,
        cacheReadTokens: cache.read ?? 0,
        cacheWriteTokens: cache.write ?? 0,
        cost: record.cost != null ? String(record.cost) : "0",
      })
      .onConflictDoNothing({ target: sessionMessage.opencodeMessageId })
      .catch((err) => {
        fastify.log.error({ sandboxId, messageId: record.messageID, err }, "Failed to persist session message");
      })
      .finally(() => pendingDbWrites.delete(insert));
    pendingDbWrites.add(insert);
  }

  async function readNewLines() {
    if (reading) return;
    reading = true;
    try {
      const stat = await fs.promises.stat(usagePath);
      if (stat.size <= offset) return;
      const length = stat.size - offset;
      const fd = await fs.promises.open(usagePath, "r");
      try {
        const { buffer } = await fd.read(Buffer.alloc(length), 0, length, offset);
        offset = stat.size;
        const text = leftover + buffer.toString("utf8");
        const lines = text.split("\n");
        leftover = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          let record;
          try { record = JSON.parse(line); } catch { continue; }
          try {
            socket.send(JSON.stringify({ type: "token-usage", ...record }));
          } catch { /* client disconnected */ }
          persistRecord(record);
        }
      } finally {
        await fd.close();
      }
    } catch (err) {
      fastify.log.error({ sandboxId, err }, "Failed to read usage file");
    } finally {
      reading = false;
    }
  }

  const watcher = fs.watch(usagePath, () => { readNewLines(); });
  return {
    cleanup: () => watcher.close(),
    drain: async () => {
      await readNewLines();
      await Promise.allSettled(pendingDbWrites);
    },
  };
}

function watchIndexHtml(sandboxWorkDirPath, sandboxId, socket, fastify) {
  const indexPath = path.join(sandboxWorkDirPath, "index.html");
  let debounceTimer = null;

  const watcher = fs.watch(indexPath, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        socket.send(JSON.stringify({ type: "file-changed", file: "index.html" }));
      } catch {
        // client disconnected
      }
      // Persist to database in the background
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

  return { watcher, cleanup: () => { watcher.close(); clearTimeout(debounceTimer); } };
}

export function wsTerminal(fastify) {
  fastify.register(async function (fastify) {
    fastify.get("/api/ws", { websocket: true }, async (socket, req) => {
      const { sandboxId } = req.query;

      const payload = verifyToken(req);
      if (!payload) {
        sendError(socket, "Authentication required.");
        return;
      }

      if (!sandboxId) {
        sendError(socket, "No sandbox ID provided.");
        return;
      }

      const record = await lookupSandbox(sandboxId, payload.userId);
      if (!record) {
        sendError(socket, "Sandbox not found.");
        return;
      }

      const { workDir: sandboxWorkDir, isNew } = await ensureSandboxWorkDir(sandboxId, record.workDir);
      if (isNew && record.indexHtmlContent) {
        fs.writeFileSync(path.join(sandboxWorkDir, "index.html"), record.indexHtmlContent);
      }

      const [session] = await db
        .insert(sandboxSession)
        .values({ userId: payload.userId, sandboxId })
        .returning({ id: sandboxSession.id });

      configureOpenCode(sandboxWorkDir);
      const ptyProcess = spawnTerminal(sandboxWorkDir);
      const { cleanup: cleanupIndexFileWatch } = watchIndexHtml(sandboxWorkDir, sandboxId, socket, fastify);
      const tokenUsageWatch = watchOpenCodeTokenUsage(sandboxWorkDir, sandboxId, session.id, socket, fastify);

      // Rate limiting: max 30 requests per minute per session.
      // Counted on terminal Enter presses; conversation content is captured by the opencode plugin.
      const MAX_REQUESTS_PER_MINUTE = 30;
      const requestTimestamps = [];
      let printableSinceEnter = 0;

      ptyProcess.onData((data) => {
        try {
          // Strip sequences that cause xterm.js issues:
          // - DECRPM queries (\x1b[?...$p) — crashes xterm.js requestMode handler
          // - Kitty graphics protocol (\x1b_...\x1b\\) — unsupported, may corrupt state
          const cleaned = data
            .replace(/\x1b\[\?\d+\$p/g, "")
            .replace(/\x1b_[^\x1b]*\x1b\\/g, "");
          if (cleaned) socket.send(JSON.stringify({ type: "output", data: cleaned }));
        } catch {
          // client disconnected
        }
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        if (exitCode !== 0) {
          fastify.log.error({ sandboxId, exitCode, signal }, "opencode process exited with error");
        }
        socket.close();
      });

      socket.on("message", (msg) => {
        const { type, data, cols, rows } = JSON.parse(msg);
        if (type === "input") {
          if (data === "\r" || data === "\n") {
            if (printableSinceEnter > 0) {
              const now = Date.now();
              while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60_000) {
                requestTimestamps.shift();
              }
              if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
                try {
                  socket.send(JSON.stringify({ type: "output", data: "\x1b[33mRate limit reached. Please wait a moment before sending more messages.\x1b[0m\r\n" }));
                } catch { /* client disconnected */ }
                printableSinceEnter = 0;
                return;
              }
              requestTimestamps.push(now);
              printableSinceEnter = 0;
            }
          } else if (data === "\x7f" || data === "\b") {
            if (printableSinceEnter > 0) printableSinceEnter -= 1;
          } else if (data.length === 1 && data >= " ") {
            printableSinceEnter += 1;
          }
          ptyProcess.write(data);
        }
        if (type === "resize") ptyProcess.resize(cols, rows);
      });

      socket.on("close", async () => {
        cleanupIndexFileWatch();
        ptyProcess.kill();
        // Drain any token-usage records the plugin wrote before the process exited,
        // and wait for the resulting session_message inserts to land.
        await tokenUsageWatch.drain();
        tokenUsageWatch.cleanup();
        // Drop the per-session usage log now that records are in the DB; a fresh
        // file is created on the next connection.
        await fs.promises.unlink(path.join(sandboxWorkDir, USAGE_REL_PATH)).catch(() => {});
        await db.update(sandboxSession)
          .set({ closedAt: new Date() })
          .where(eq(sandboxSession.id, session.id))
          .catch((err) => {
            fastify.log.error({ sessionId: session.id, err }, "Failed to close sandbox session");
          });
      });
    });
  });
}
