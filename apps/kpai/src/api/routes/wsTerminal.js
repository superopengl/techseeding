import pty from "node-pty";
import { db } from "../db/index.js";
import { studentSession } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { createStudentSandbox } from "../lib/sandboxManager.js";

export function wsTerminal(fastify) {
  fastify.register(async function (fastify) {
    fastify.get("/ws", { websocket: true }, (socket, req) => {
      const sandboxId = req.query.sandboxId;

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

      const { gamePath } = createStudentSandbox(sandboxId);

      const ptyProcess = pty.spawn(
        "claude",
        [
          "--allowedTools",
          "Edit,Write,Read,Bash(cat),Bash(ls),Bash(mkdir),Bash(cp)",
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
