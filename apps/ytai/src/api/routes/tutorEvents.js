import { and, eq } from 'drizzle-orm';
import db from '../db/index.js';
import { tutorSession } from '../db/schema.js';
import { subscribe } from '../lib/sessionEventBus.js';

// Heartbeat keeps the connection alive through proxies that idle-close
// silent HTTP streams (Azure Front Door, nginx defaults around 60s).
// 25s is the common safe value.
const HEARTBEAT_MS = 25_000;

// Long-lived SSE channel for cross-device state sync. Every device
// viewing a session opens one of these on mount; mutation routes call
// publish() on the bus and every other device on the session learns
// about it within milliseconds.
//
// Auth: standard JWT verify happens in the onRequest hook in server.js.
// We additionally verify the session row belongs to the caller — a user
// can't open an events stream on someone else's session.
//
// senderClientId: an opaque per-tab UUID the frontend generates. Passed
// as ?clientId=...; if the event's senderClientId matches, we skip it
// (a device shouldn't be told about its own writes). Without this
// filter, an optimistic UI update gets clobbered by a refetch racing
// the local write back to the screen.
export default function tutorEvents(fastify) {
  fastify.get('/api/tutor/:sessionId/events', async (request, reply) => {
    const { sessionId } = request.params;
    const userId = request.userId;
    const senderClientId =
      typeof request.query?.clientId === 'string' && request.query.clientId.length > 0
        ? request.query.clientId
        : null;

    const [session] = await db()
      .select({ id: tutorSession.id })
      .from(tutorSession)
      .where(and(eq(tutorSession.id, sessionId), eq(tutorSession.userId, userId)));

    if (!session) {
      reply.code(404);
      return { error: 'Session not found' };
    }

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    let clientClosed = false;
    function send(event, data) {
      if (clientClosed) return;
      try {
        raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        clientClosed = true;
      }
    }

    send('ready', { sessionId });

    const heartbeat = setInterval(() => {
      if (clientClosed) {
        clearInterval(heartbeat);
        return;
      }
      try {
        raw.write(':\n\n');
      } catch {
        clientClosed = true;
        clearInterval(heartbeat);
      }
    }, HEARTBEAT_MS);
    heartbeat.unref?.();

    let unsubscribe = null;
    try {
      unsubscribe = await subscribe(
        sessionId,
        (payload) => {
          if (senderClientId && payload?.senderClientId === senderClientId) return;
          send('event', payload);
        },
        request.log
      );
    } catch (err) {
      request.log.error({ err: err?.message, sessionId }, 'tutorEvents: failed to subscribe to bus');
      clearInterval(heartbeat);
      send('error', { error: 'event-bus-unavailable' });
      try {
        raw.end();
      } catch {
        /* socket already gone */
      }
      return;
    }

    const cleanup = () => {
      if (clientClosed) return;
      clientClosed = true;
      clearInterval(heartbeat);
      try {
        unsubscribe?.();
      } catch {
        /* already unsubscribed */
      }
      try {
        raw.end();
      } catch {
        /* socket gone */
      }
    };

    request.raw.on('close', cleanup);
    request.raw.on('error', cleanup);
  });
}
