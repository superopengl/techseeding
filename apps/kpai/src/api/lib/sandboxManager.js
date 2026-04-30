import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..", "..", "..");
const SANDBOX_SAMPLE_DIR = path.join(__dirname, "..", "resources", "sandbox_sample");

export function createSandbox(sandboxId) {
  const workDir = path.join(os.tmpdir(), "lab67", "sandbox", sandboxId);

  if (!fs.existsSync(workDir)) {
    fs.cpSync(SANDBOX_SAMPLE_DIR, workDir, { recursive: true });
  }

  return workDir;
}

const SANDBOXES_DIR = path.join(ROOT_DIR, "sandboxes");

export { ROOT_DIR, SANDBOXES_DIR };
