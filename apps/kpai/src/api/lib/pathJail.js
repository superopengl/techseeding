import path from "path";
import fs from "fs/promises";

// Resolve `relPath` against `jailDir` and refuse anything that escapes the jail.
// This is the single chokepoint every craft tool must go through — losing it
// would mean a prompt-injected tool call could read /etc/passwd or write into
// another student's sandbox. The checks below are intentionally redundant:
//
//   1. Reject null bytes (truncate-on-write tricks).
//   2. Resolve symbolically with the jail root as the prefix, then require the
//      result to live under that prefix (no `..` escape, no absolute path
//      pointing elsewhere).
//   3. Realpath the result when the target exists. realpath follows symlinks,
//      so a symlink dropped into the jail that points outside is caught here.
//      Missing files are fine — the symlink check still applies to the parent
//      directory, which must exist for a write to succeed anyway.
//
// Returns the absolute, jail-relative-safe path. Throws on any violation.
export async function resolveInJail(jailDir, relPath) {
  if (typeof relPath !== "string" || relPath.length === 0) {
    throw new Error("path is required");
  }
  if (relPath.includes("\0")) throw new Error("path contains null byte");

  const jailReal = await fs.realpath(jailDir);
  const resolved = path.resolve(jailReal, relPath);
  const rel = path.relative(jailReal, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`path escapes sandbox: ${relPath}`);
  }

  try {
    const realResolved = await fs.realpath(resolved);
    const realRel = path.relative(jailReal, realResolved);
    if (realRel.startsWith("..") || path.isAbsolute(realRel)) {
      throw new Error(`symlink escapes sandbox: ${relPath}`);
    }
    return realResolved;
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // Target doesn't exist yet — verify its parent is inside the jail by
    // realpath'ing the parent. If the parent doesn't exist either we refuse:
    // craft tools never create directories.
    const parent = path.dirname(resolved);
    const parentReal = await fs.realpath(parent);
    const parentRel = path.relative(jailReal, parentReal);
    if (parentRel.startsWith("..") || (path.isAbsolute(parentRel) && parentRel !== "")) {
      throw new Error(`parent directory escapes sandbox: ${relPath}`);
    }
    return path.join(parentReal, path.basename(resolved));
  }
}
