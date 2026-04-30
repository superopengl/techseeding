import pty from "node-pty";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
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

      const ptyProcess = pty.spawn(
        "claude",
        [
          "--allowedTools",
          "Read(index.html),Edit(index.html)",
        ],
        {
          name: "xterm-256color",
          cols: 80,
          rows: 24,
          cwd: gamePath,
          env: {
            ...process.env,
            HOME: gamePath,
          },
        }
      );

      ptyProcess.onData((data) => {
        try {
          socket.send(JSON.stringify({ type: "output", data }));
        } catch (e) {
          // client disconnected
        }
      });

      ptyProcess.onExit(() => {
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
        ptyProcess.kill();
      });
    });
  });
}
