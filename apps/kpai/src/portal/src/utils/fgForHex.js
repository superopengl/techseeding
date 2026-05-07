export function fgForHex(hex) {
  if (typeof hex !== "string") return "#ffffff";
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 150 ? "#1a1a2e" : "#ffffff";
}
