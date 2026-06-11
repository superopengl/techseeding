import path from "path";
import fs from "fs/promises";
import { db } from "../db/index.js";
import { sandbox } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { ensureSandboxWorkDir } from "../lib/sandboxManager.js";
import { success, error } from "../lib/response.js";

const MAX_LENGTH = 2_000_000;

export function adminSandboxUpload(fastify) {
  fastify.post(
    "/api/admin/sandbox/:sandboxId/upload",
    { bodyLimit: 4 * 1024 * 1024 },
    async (request, reply) => {
      const { sandboxId } = request.params;
      const { content } = request.body || {};

      if (typeof content !== "string") {
        return error(reply, 400, "BAD_REQUEST", "content must be a string");
      }
      if (content.length > MAX_LENGTH) {
        return error(reply, 400, "BAD_REQUEST", `content must be ${MAX_LENGTH} characters or less`);
      }

      const [record] = await db
        .select({ workDir: sandbox.workDir })
        .from(sandbox)
        .where(eq(sandbox.id, sandboxId));

      if (!record) {
        return error(reply, 404, "NOT_FOUND", "Sandbox not found");
      }

      await db
        .update(sandbox)
        .set({ indexHtmlContent: content, updatedAt: new Date() })
        .where(eq(sandbox.id, sandboxId));

      try {
        const { workDir } = await ensureSandboxWorkDir(sandboxId, record.workDir);
        await fs.writeFile(path.join(workDir, "index.html"), content);
      } catch (err) {
        fastify.log.error({ err, sandboxId }, "failed to sync uploaded index.html to sandbox work dir");
        return error(reply, 500, "WORKDIR_SYNC_FAILED", "Saved to database but failed to sync to sandbox work dir");
      }

      return success({ length: content.length });
    },
  );
}
