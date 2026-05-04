function hashString(s, seed) {
  let h = seed;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorForName(name) {
  const key = (name || "").trim().toLowerCase() || "anon";
  const r = hashString(key, 5381) % 256;
  const g = hashString(key, 52711) % 256;
  const b = hashString(key, 1313) % 256;
  // Perceived brightness via ITU-R BT.601 — picks white text on dark backgrounds
  // and a dark slate on light backgrounds for legible contrast.
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const fg = luma > 150 ? "#1a1a2e" : "#ffffff";
  return { bg: `rgb(${r}, ${g}, ${b})`, fg };
}
