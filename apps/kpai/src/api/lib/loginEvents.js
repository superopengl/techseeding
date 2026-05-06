const subscribers = new Map();

export function subscribeLogin(loginRequestId, send) {
  let set = subscribers.get(loginRequestId);
  if (!set) {
    set = new Set();
    subscribers.set(loginRequestId, set);
  }
  set.add(send);
  return () => {
    const current = subscribers.get(loginRequestId);
    if (!current) return;
    current.delete(send);
    if (current.size === 0) subscribers.delete(loginRequestId);
  };
}

export function publishLoginEvent(loginRequestId, type, payload) {
  const set = subscribers.get(loginRequestId);
  if (!set) return;
  const message = JSON.stringify({ type, payload });
  for (const send of set) {
    try {
      send(message);
    } catch {
      set.delete(send);
    }
  }
}
