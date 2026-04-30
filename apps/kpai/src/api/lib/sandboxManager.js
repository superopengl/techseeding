import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..", "..", "..");
const SANDBOXES_DIR = path.join(ROOT_DIR, "sandboxes");
const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");

fs.mkdirSync(SANDBOXES_DIR, { recursive: true });

export function createSandbox(sandboxId) {
  const sandboxPath = path.join(SANDBOXES_DIR, sandboxId);
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

export { SANDBOXES_DIR, ROOT_DIR };
