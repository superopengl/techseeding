import { db } from "../db/index.js";
import { sandbox, user, studentProfile, craftLike, craftPlay } from "../db/schema.js";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { verifyToken } from "../lib/verifyToken.js";
import { success, error } from "../lib/response.js";

// Single published craft fetch, used by /craft/:id (formerly /api/discover/:id).
// Returns owner identity, fork lineage (one ancestor), engagement counts, and
// the viewer's like state.
export function craftGet(fastify) {
  fastify.get("/api/craft/:sandboxId", async (request, reply) => {
    const { sandboxId } = request.params;

    const sourceSandbox = alias(sandbox, "source_sandbox");
    const sourceUser = alias(user, "source_user");

    const [row] = await db
      .select({
        id: sandbox.id,
        title: sandbox.title,
        description: sandbox.description,
        publishedAt: sandbox.publishedAt,
        forkedFromSandboxId: sandbox.forkedFromSandboxId,
        ownerUserId: user.id,
        ownerUserName: user.userName,
        ownerFirstName: studentProfile.firstName,
        ownerLastName: studentProfile.lastName,
        ownerAvatarColor: studentProfile.avatarColor,
        sourceTitle: sourceSandbox.title,
        sourceOwnerUserName: sourceUser.userName,
      })
      .from(sandbox)
      .innerJoin(user, eq(user.id, sandbox.userId))
      .leftJoin(studentProfile, eq(studentProfile.userId, user.id))
      .leftJoin(sourceSandbox, eq(sourceSandbox.id, sandbox.forkedFromSandboxId))
      .leftJoin(sourceUser, eq(sourceUser.id, sourceSandbox.userId))
      .where(and(eq(sandbox.id, sandboxId), isNotNull(sandbox.publishedAt)))
      .limit(1);
    if (!row) {
      return error(reply, 404, "NOT_FOUND", "Craft not found");
    }

    const [[{ likeCount }], [{ playCount }], [{ forkCount }]] = await Promise.all([
      db.select({ likeCount: sql`count(*)::int` }).from(craftLike).where(eq(craftLike.sandboxId, sandboxId)),
      db.select({ playCount: sql`count(*)::int` }).from(craftPlay).where(eq(craftPlay.sandboxId, sandboxId)),
      db.select({ forkCount: sql`count(*)::int` }).from(sandbox).where(eq(sandbox.forkedFromSandboxId, sandboxId)),
    ]);

    const viewer = verifyToken(request);
    let viewerLiked = false;
    if (viewer?.userId) {
      const [liked] = await db
        .select({ id: craftLike.id })
        .from(craftLike)
        .where(and(eq(craftLike.sandboxId, sandboxId), eq(craftLike.viewerUserId, viewer.userId)))
        .limit(1);
      viewerLiked = !!liked;
    }

    const { sourceTitle, sourceOwnerUserName, ...rest } = row;
    const forkedFrom = row.forkedFromSandboxId
      ? { id: row.forkedFromSandboxId, title: sourceTitle, ownerUserName: sourceOwnerUserName }
      : null;

    return success({ ...rest, forkedFrom, likeCount, playCount, forkCount, viewerLiked });
  });
}
