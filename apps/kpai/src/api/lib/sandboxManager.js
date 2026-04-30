import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..", "..", "..");
const SANDBOXES_DIR = path.join(ROOT_DIR, "sandboxes");
const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");

fs.mkdirSync(SANDBOXES_DIR, { recursive: true });

export function createStudentSandbox(studentId) {
  const sandboxPath = path.join(SANDBOXES_DIR, studentId);
  const gamePath = path.join(sandboxPath, "game");

  if (!fs.existsSync(gamePath)) {
    fs.mkdirSync(gamePath, { recursive: true });

    const templateFiles = fs.readdirSync(TEMPLATES_DIR);
    for (const file of templateFiles) {
      fs.copyFileSync(
        path.join(TEMPLATES_DIR, file),
        path.join(gamePath, file)
      );
    }
  }

  return { sandboxPath, gamePath };
}

export function generateStudentId() {
  return crypto.randomBytes(4).toString("hex");
}

export { SANDBOXES_DIR, ROOT_DIR };
