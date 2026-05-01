import pty from "node-pty";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import os from "os";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.LAB67_JWT_SECRET;

export function wsTerminal(fastify) {
  fastify.register(async function (fastify) {
    fastify.get("/ws", { websocket: true }, async (socket, req) => {
      const { sandboxId, token } = req.query;

      if (!token) {
        socket.send(
          JSON.stringify({
            type: "output",
            data: "\x1b[31mError: Authentication required.\x1b[0m\r\n",
          })
        );
        socket.close();
        return;
      }

      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch {
        socket.send(
          JSON.stringify({
            type: "output",
            data: "\x1b[31mError: Invalid or expired token.\x1b[0m\r\n",
          })
        );
        socket.close();
        return;
      }

      if (!sandboxId) {
        socket.send(
          JSON.stringify({
            type: "output",
            data: "\x1b[31mError: No sandbox ID provided.\x1b[0m\r\n",
          })
        );
        socket.close();
        return;
      }

      const [record] = await db
        .select({ workDir: sandbox.workDir })
        .from(sandbox)
        .where(eq(sandbox.id, sandboxId));

      if (!record || !record.workDir) {
        socket.send(
          JSON.stringify({
            type: "output",
            data: "\x1b[31mError: Sandbox not found.\x1b[0m\r\n",
          })
        );
        socket.close();
        return;
      }

      const gamePath = record.workDir;

      const opencodeConfigFilePath = path.join(gamePath, "opencode.json");
      const deepseekApiKey = process.env.LAB67_SANDBOX_DEEPSEEK_API_KEY;

      // Write opencode.json config to the game directory so OpenCode picks up DeepSeek
      const openCodeConfig = JSON.parse(fs.readFileSync(opencodeConfigFilePath, 'utf-8'));
      openCodeConfig.provider.deepseek.options.apiKey = deepseekApiKey;

      fs.mkdirSync(gamePath, { recursive: true });
      fs.writeFileSync(
        opencodeConfigFilePath,
        JSON.stringify(openCodeConfig, null, 2)
      );

      const envVars = {
        ...process.env,
        HOME: os.homedir(),
      };

      const ptyProcess = pty.spawn("opencode", [], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: gamePath,
        env: envVars,
      });

      // ptyProcess.write(`opencode\r`);

      // Watch index.html for changes and notify the frontend to refresh the preview
      const indexPath = path.join(gamePath, "index.html");
      let fileChangeTimer = null;
      const watcher = fs.watch(indexPath, () => {
        // Debounce to avoid rapid-fire notifications during multi-write edits
        clearTimeout(fileChangeTimer);
        fileChangeTimer = setTimeout(() => {
          try {
            socket.send(JSON.stringify({ type: "file-changed", file: "index.html" }));
          } catch {
            // client disconnected
          }
        }, 300);
      });

      ptyProcess.onData((data) => {
        try {
          socket.send(JSON.stringify({ type: "output", data }));
        } catch (e) {
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
        const parsed = JSON.parse(msg);
        switch (parsed.type) {
          case "input":
            ptyProcess.write(parsed.data);
            break;
          case "resize":
            ptyProcess.resize(parsed.cols, parsed.rows);
            break;
        }
      });

      socket.on("close", () => {
        watcher.close();
        clearTimeout(fileChangeTimer);
        ptyProcess.kill();
      });
    });
  });
}
