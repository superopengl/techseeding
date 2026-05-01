import pty from "node-pty";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { sandbox, sandboxSession, sessionMessage } from "../db/schema.js";
import os from "os";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { ensureSandboxWorkDir } from "../lib/sandboxManager.js";

const JWT_SECRET = process.env.LAB67_JWT_SECRET;

function sendError(socket, message) {
  socket.send(JSON.stringify({ type: "output", data: `\x1b[31mError: ${message}\x1b[0m\r\n` }));
  socket.close();
}

function authenticateToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function lookupSandbox(sandboxId) {
  const [record] = await db
    .select({ workDir: sandbox.workDir, indexHtmlContent: sandbox.indexHtmlContent })
    .from(sandbox)
    .where(eq(sandbox.id, sandboxId));
  return record || null;
}

function configureOpenCode(gamePath) {
  const configPath = path.join(gamePath, "opencode.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  config.provider.deepseek.options.apiKey = process.env.LAB67_SANDBOX_DEEPSEEK_API_KEY;
  fs.mkdirSync(gamePath, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function spawnTerminal(gamePath) {
  return pty.spawn("opencode", [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: gamePath,
    env: { ...process.env, HOME: os.homedir() },
  });
}

function watchIndexHtml(gamePath, sandboxId, socket, fastify) {
  const indexPath = path.join(gamePath, "index.html");
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
    fastify.get("/ws", { websocket: true }, async (socket, req) => {
      const { sandboxId, token } = req.query;

      const payload = authenticateToken(token);
      if (!payload) {
        sendError(socket, token ? "Invalid or expired token." : "Authentication required.");
        return;
      }

      if (!sandboxId) {
        sendError(socket, "No sandbox ID provided.");
        return;
      }

      const record = await lookupSandbox(sandboxId);
      if (!record?.workDir) {
        sendError(socket, "Sandbox not found.");
        return;
      }

      const { workDir: sandboxWorkDir, isNew } = ensureSandboxWorkDir(sandboxId);
      if (isNew && record.indexHtmlContent) {
        fs.writeFileSync(path.join(sandboxWorkDir, "index.html"), record.indexHtmlContent);
      }

      const [session] = await db
        .insert(sandboxSession)
        .values({ userId: payload.userId, sandboxId })
        .returning({ id: sandboxSession.id });

      configureOpenCode(sandboxWorkDir);
      const ptyProcess = spawnTerminal(sandboxWorkDir);
      const { cleanup } = watchIndexHtml(sandboxWorkDir, sandboxId, socket, fastify);

      // Message capture buffers
      let inputBuffer = "";
      let outputBuffer = "";
      let outputDebounceTimer = null;

      function saveMessage(type, text) {
        db.insert(sessionMessage)
          .values({ sandboxSessionId: session.id, content: { text }, type })
          .catch((err) => {
            fastify.log.error({ sessionId: session.id, type, err }, "Failed to save session message");
          });
      }

      function flushOutput() {
        if (outputBuffer.length > 0) {
          saveMessage("response", outputBuffer);
          outputBuffer = "";
        }
      }

      ptyProcess.onData((data) => {
        try {
          socket.send(JSON.stringify({ type: "output", data }));
        } catch {
          // client disconnected
        }
        outputBuffer += data;
        clearTimeout(outputDebounceTimer);
        outputDebounceTimer = setTimeout(flushOutput, 1000);
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
          ptyProcess.write(data);
          if (data === "\r" || data === "\n") {
            if (inputBuffer.length > 0) {
              // Flush any pending output before saving the new input
              clearTimeout(outputDebounceTimer);
              flushOutput();
              saveMessage("request", inputBuffer);
              inputBuffer = "";
            }
          } else if (data === "\x7f" || data === "\b") {
            // Backspace — remove last character
            inputBuffer = inputBuffer.slice(0, -1);
          } else if (data.length === 1 && data >= " ") {
            // Printable character
            inputBuffer += data;
          }
        }
        if (type === "resize") ptyProcess.resize(cols, rows);
      });

      socket.on("close", () => {
        clearTimeout(outputDebounceTimer);
        flushOutput();
        cleanup();
        ptyProcess.kill();
        db.update(sandboxSession)
          .set({ closedAt: new Date() })
          .where(eq(sandboxSession.id, session.id))
          .catch((err) => {
            fastify.log.error({ sessionId: session.id, err }, "Failed to close sandbox session");
          });
      });
    });
  });
}
