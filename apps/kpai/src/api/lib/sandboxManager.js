import path from "path";
import os from "os";
import fs from "fs/promises";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..", "..", "..");
const SANDBOX_SAMPLE_DIR = path.join(__dirname, "..", "resources", "sandbox_sample");

export async function ensureSandboxWorkDir(sandboxId) {
  const workDir = path.join(os.tmpdir(), "kidplayai", "sandbox", sandboxId);
  let existed = true;
  try {
    await fs.access(workDir);
  } catch {
    existed = false;
  }

  if (!existed) {
    await fs.cp(SANDBOX_SAMPLE_DIR, workDir, { recursive: true });
    execFileSync("git", ["init"], { cwd: workDir, stdio: "ignore" });
  }

  return { workDir, isNew: !existed };
}

const SANDBOXES_DIR = path.join(ROOT_DIR, "sandboxes");

export { ROOT_DIR, SANDBOXES_DIR };
