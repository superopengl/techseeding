export function stripAnsi(text) {
  return text
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)?/g, "")
    .replace(/\x1b\[[?>=!]?[0-9;]*[ -/]*[A-Za-z@-~]/g, "")
    .replace(/\x1b[A-Za-z0-9=><]/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim();
}
