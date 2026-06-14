import { sql } from '../db/index.js';

// Cross-replica fanout for tutor-session state changes. Mutation routes
// call publish(); long-lived SSE clients call subscribe() to learn about
// other devices/replicas. The transport underneath is Postgres LISTEN/
// NOTIFY on a single global channel — every replica receives every
// session's events and filters locally. Cheap enough for our scale and
// avoids paying for Redis or SignalR.
//
// Channel names are tied to identifiers in Postgres, so we can't include
// dynamic IDs (sessionId, etc.) in the channel name without quoting them
// every NOTIFY/LISTEN; using one channel + a sessionId in the payload is
// simpler and the per-replica filter is O(active sessions on that replica).

const CHANNEL = 'tutor_session_events';
// pg_notify caps the payload at ~8000 bytes. Our payloads are tiny
// (sessionId + a small `type` + a few id strings), so this is purely a
// guardrail in case a future caller tries to shove something fat through.
const MAX_PAYLOAD_BYTES = 7900;

const subscribers = new Map();
let listenPromise = null;

async function ensureListening(log) {
  if (listenPromise) return listenPromise;
  listenPromise = sql()
    .listen(CHANNEL, (payloadStr) => handleNotification(payloadStr, log))
    .catch((err) => {
      listenPromise = null;
      throw err;
    });
  return listenPromise;
}

function handleNotification(payloadStr, log) {
  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return;
  }
  const sessionId = payload?.sessionId;
  if (!sessionId) return;
  const subs = subscribers.get(sessionId);
  if (!subs || subs.size === 0) return;
  for (const cb of subs) {
    try {
      cb(payload);
    } catch (err) {
      log?.warn?.({ err: err?.message, sessionId }, 'sessionEventBus subscriber threw');
    }
  }
}

// Best-effort fanout — caller's success path shouldn't fail if the
// NOTIFY blows up, since the row is already committed and a refresh on
// the receiver will catch up the next time they poke the API anyway.
export async function publish(sessionId, type, extras = {}, log) {
  if (!sessionId || !type) return;
  const payload = JSON.stringify({ sessionId, type, ...extras });
  if (Buffer.byteLength(payload) > MAX_PAYLOAD_BYTES) {
    log?.warn?.({ sessionId, type, bytes: payload.length }, 'sessionEventBus payload too large, dropping');
    return;
  }
  try {
    await sql().notify(CHANNEL, payload);
  } catch (err) {
    log?.warn?.({ err: err?.message, sessionId, type }, 'sessionEventBus publish failed');
  }
}

export async function subscribe(sessionId, cb, log) {
  await ensureListening(log);
  let set = subscribers.get(sessionId);
  if (!set) {
    set = new Set();
    subscribers.set(sessionId, set);
  }
  set.add(cb);
  return function unsubscribe() {
    const cur = subscribers.get(sessionId);
    if (!cur) return;
    cur.delete(cb);
    if (cur.size === 0) subscribers.delete(sessionId);
  };
}
