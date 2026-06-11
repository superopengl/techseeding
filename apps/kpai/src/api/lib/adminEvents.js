const subscribers = new Set();

export function subscribeAdmin(send) {
  subscribers.add(send);
  return () => subscribers.delete(send);
}

export function publishAdminEvent(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const send of subscribers) {
    try {
      send(message);
    } catch {
      subscribers.delete(send);
    }
  }
}
