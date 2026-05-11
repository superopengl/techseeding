import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { tool } from "ai";
import { resolveInJail } from "./pathJail.js";

const INDEX_FILE = "index.html";
const MAX_BYTES = 256 * 1024;

// Hardcoding the filename keeps the model's choice surface tiny: it never
// names a path, so the jail helper is just defense-in-depth against a
// misconfigured workDir. If we ever expand to multi-file crafts, change to
// `inputSchema: z.object({ path: z.string() })` and feed `args.path` through
// `resolveInJail`.
export function buildCraftTools({ workDir, onCraftChanged }) {
  async function resolveIndex() {
    return resolveInJail(workDir, INDEX_FILE);
  }

  return {
    read: tool({
      description: "Read the current contents of the craft's index.html.",
      inputSchema: z.object({}),
      execute: async () => {
        const full = await resolveIndex();
        const content = await fs.readFile(full, "utf-8");
        return { content };
      },
    }),

    write: tool({
      description:
        "Replace the entire contents of index.html with new HTML. Use this when starting fresh or when more than half the file changes. The content must be a complete, valid HTML document with inline CSS/JS — no external files.",
      inputSchema: z.object({
        content: z.string().describe("The full new HTML document"),
      }),
      execute: async ({ content }) => {
        if (typeof content !== "string") {
          throw new Error("content must be a string");
        }
        if (Buffer.byteLength(content, "utf-8") > MAX_BYTES) {
          throw new Error(`content exceeds ${MAX_BYTES} bytes`);
        }
        const full = await resolveIndex();
        await fs.writeFile(full, content, "utf-8");
        await onCraftChanged?.(content);
        return { ok: true, bytes: Buffer.byteLength(content, "utf-8") };
      },
    }),

    edit: tool({
      description:
        "Make a targeted edit to index.html by replacing one exact substring with another. Prefer this over `write` for small changes. `oldString` must appear in the file exactly once unless `replaceAll` is true.",
      inputSchema: z.object({
        oldString: z.string().min(1).describe("Exact text to find"),
        newString: z.string().describe("Replacement text"),
        replaceAll: z.boolean().optional().describe("Replace every occurrence (default false)"),
      }),
      execute: async ({ oldString, newString, replaceAll }) => {
        const full = await resolveIndex();
        const before = await fs.readFile(full, "utf-8");
        if (!before.includes(oldString)) {
          throw new Error("oldString not found in index.html");
        }
        let after;
        if (replaceAll) {
          after = before.split(oldString).join(newString);
        } else {
          const first = before.indexOf(oldString);
          const second = before.indexOf(oldString, first + oldString.length);
          if (second !== -1) {
            throw new Error("oldString appears multiple times; pass replaceAll:true or provide a more unique snippet");
          }
          after = before.slice(0, first) + newString + before.slice(first + oldString.length);
        }
        if (Buffer.byteLength(after, "utf-8") > MAX_BYTES) {
          throw new Error(`result exceeds ${MAX_BYTES} bytes`);
        }
        await fs.writeFile(full, after, "utf-8");
        await onCraftChanged?.(after);
        return { ok: true, bytes: Buffer.byteLength(after, "utf-8") };
      },
    }),
  };
}

export { INDEX_FILE };
