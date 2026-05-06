import { db } from "../db/index.js";
import { loginRequest } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { subscribeLogin } from "../lib/loginEvents.js";

export function wsLogin(fastify) {
  fastify.register(async function (fastify) {
    fastify.get("/api/ws/login/:loginRequestId", { websocket: true }, async (socket, req) => {
      const { loginRequestId } = req.params;

      const send = (msg) => {
        try { socket.send(msg); } catch { /* socket already closed */ }
      };

      const unsubscribe = subscribeLogin(loginRequestId, send);

      const [record] = await db
        .select({ status: loginRequest.status })
        .from(loginRequest)
        .where(eq(loginRequest.id, loginRequestId));

      if (!record) {
        send(JSON.stringify({ type: "not_found" }));
        socket.close();
        unsubscribe();
        return;
      }

      send(JSON.stringify({ type: "status", payload: { status: record.status } }));

      const heartbeat = setInterval(() => {
        send(JSON.stringify({ type: "ping" }));
      }, 30_000);

      socket.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    });
  });
}
