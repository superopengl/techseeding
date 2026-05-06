import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { error } from "../lib/response.js";

export function adminSandboxPreview(fastify) {
  fastify.get("/api/admin/sandbox/:sandboxId/preview", async (request, reply) => {
    const { sandboxId } = request.params;

    const [record] = await db
      .select({ indexHtmlContent: sandbox.indexHtmlContent })
      .from(sandbox)
      .where(eq(sandbox.id, sandboxId));

    if (!record) {
      return error(reply, 404, "NOT_FOUND", "Sandbox not found");
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
      .send(record.indexHtmlContent || "");
  });
}
