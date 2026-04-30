import path from "path";
import fs from "fs";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { error } from "../lib/response.js";

export function sandboxPreview(fastify) {
  fastify.get("/sandbox/:sandboxId/preview", async (request, reply) => {
    const { sandboxId } = request.params;

    const [record] = await db
      .select({ workDir: sandbox.workDir })
      .from(sandbox)
      .where(eq(sandbox.id, sandboxId));

    if (!record || !record.workDir) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
    }

    const filePath = path.join(record.workDir, "index.html");

    if (!fs.existsSync(filePath)) {
      return error(reply, 404, "NOT_FOUND", "index.html not found");
    }

    const stream = fs.createReadStream(filePath);

    return reply
      .header("Cache-Control", "no-store, no-cache, must-revalidate")
      .header("Pragma", "no-cache")
      .header("Expires", "0")
      .type("text/html")
      .send(stream);
  });
}
