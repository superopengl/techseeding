import path from "path";
import fs from "fs/promises";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { ensureSandboxWorkDir } from "../lib/sandboxManager.js";
import { error } from "../lib/response.js";

export function adminSandboxPreview(fastify) {
  fastify.get("/api/admin/sandbox/:sandboxId/preview", async (request, reply) => {
    const { sandboxId } = request.params;

    const [record] = await db
      .select({ indexHtmlContent: sandbox.indexHtmlContent, workDir: sandbox.workDir })
      .from(sandbox)
      .where(eq(sandbox.id, sandboxId));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }

    const indexHtmlContent = record.indexHtmlContent || "";

    try {
      const { workDir } = await ensureSandboxWorkDir(sandboxId, record.workDir);
      await fs.writeFile(path.join(workDir, "index.html"), indexHtmlContent);
    } catch (err) {
      fastify.log.error({ err, sandboxId }, "failed to sync index.html to sandbox work dir");
    }

    return reply
      .header("Cache-Control", "no-store, no-cache, must-revalidate")
      .header("Pragma", "no-cache")
      .header("Expires", "0")
      .header(
        "Content-Security-Policy",
        "sandbox allow-scripts; frame-ancestors 'self'; script-src 'unsafe-inline'",
      )
      .header("X-Content-Type-Options", "nosniff")
      .type("text/html")
      .send(indexHtmlContent);
  });
}
