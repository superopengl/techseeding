import pty from "node-pty";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import os from "os";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

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
    .select({ workDir: sandbox.workDir })
    .from(sandbox)
    .where(eq(sandbox.id, sandboxId));
  return record?.workDir || null;
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

      if (!authenticateToken(token)) {
        sendError(socket, token ? "Invalid or expired token." : "Authentication required.");
        return;
      }

      if (!sandboxId) {
        sendError(socket, "No sandbox ID provided.");
        return;
      }

      const gamePath = await lookupSandbox(sandboxId);
      if (!gamePath) {
        sendError(socket, "Sandbox not found.");
        return;
      }

      configureOpenCode(gamePath);
      const ptyProcess = spawnTerminal(gamePath);
      const { cleanup } = watchIndexHtml(gamePath, sandboxId, socket, fastify);

      ptyProcess.onData((data) => {
        try {
          socket.send(JSON.stringify({ type: "output", data }));
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
        if (type === "input") ptyProcess.write(data);
        if (type === "resize") ptyProcess.resize(cols, rows);
      });

      socket.on("close", () => {
        cleanup();
        ptyProcess.kill();
      });
    });
  });
}
