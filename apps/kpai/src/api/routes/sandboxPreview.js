import path from "path";
import fs from "fs";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { error } from "../lib/response.js";

export function sandboxPreview(fastify) {
  fastify.get("/api/sandbox/:sandboxId/preview", async (request, reply) => {
    const { sandboxId } = request.params;

    const [record] = await db
      .select({ workDir: sandbox.workDir, indexHtmlContent: sandbox.indexHtmlContent })
      .from(sandbox)
      .where(eq(sandbox.id, sandboxId));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }

    const filePath = record.workDir ? path.join(record.workDir, "index.html") : null;
    const fileExists = filePath && fs.existsSync(filePath);

    if (!fileExists && !record.indexHtmlContent) {
      return error(reply, 404, "NOT_FOUND", "index.html not found");
    }

    reply
      .header("Cache-Control", "no-store, no-cache, must-revalidate")
      .header("Pragma", "no-cache")
      .header("Expires", "0")
      .type("text/html");

    if (fileExists) {
      return reply.send(fs.createReadStream(filePath));
    }

    return reply.send(record.indexHtmlContent);
  });
}
