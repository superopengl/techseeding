import jwt from "jsonwebtoken";
import { subscribeAdmin } from "../lib/adminEvents.js";

const JWT_SECRET = process.env.KPAI_JWT_SECRET;

function authenticate(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function wsAdmin(fastify) {
  fastify.register(async function (fastify) {
    fastify.get("/api/ws/admin", { websocket: true }, (socket, req) => {
      const { token } = req.query;
      const payload = authenticate(token);
      if (!payload || payload.role !== "admin") {
        try {
          socket.send(JSON.stringify({ type: "error", message: "Admin authentication required" }));
        } catch { /* socket already closed */ }
        socket.close();
        return;
      }

      const send = (msg) => socket.send(msg);
      const unsubscribe = subscribeAdmin(send);

      socket.send(JSON.stringify({ type: "ready" }));

      const heartbeat = setInterval(() => {
        try {
          socket.send(JSON.stringify({ type: "ping" }));
        } catch { /* socket already closed */ }
      }, 30_000);

      socket.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    });
  });
}
