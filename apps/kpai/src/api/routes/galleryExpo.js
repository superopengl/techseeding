import { db } from "../db/index.js";
import { sandbox, user, studentProfile, gallery, userGallery, craftLike, craftPlay } from "../db/schema.js";
import { eq, and, desc, isNotNull, inArray, sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { verifyToken } from "../lib/verifyToken.js";

// Big-card cohort expo view (kid-grouped). Same crafts that show in the
// /api/gallery/:id feed, but enriched with per-craft engagement counts +
// viewer like state so the page can render Like / Fork controls inline.
export function galleryExpo(fastify) {
  fastify.get("/api/gallery/:galleryId/expo", async (request, reply) => {
    const { galleryId } = request.params;

    const [g] = await db
      .select({ id: gallery.id, name: gallery.name, colorHex: gallery.colorHex })
      .from(gallery)
      .where(eq(gallery.id, galleryId))
      .limit(1);
    if (!g) {
      return error(reply, 404, "NOT_FOUND", "Gallery not found");
    }

    const rows = await db
      .select({
        id: sandbox.id,
        title: sandbox.title,
        updatedAt: sandbox.updatedAt,
        publishedAt: sandbox.publishedAt,
        forkedFromSandboxId: sandbox.forkedFromSandboxId,
        userId: user.id,
        userName: user.userName,
        firstName: studentProfile.firstName,
        lastName: studentProfile.lastName,
        avatarColor: studentProfile.avatarColor,
        likeCount: sql`count(distinct ${craftLike.id})::int`,
        playCount: sql`count(distinct ${craftPlay.id})::int`,
        forkCount: sql`(select count(*)::int from ${sandbox} as forks where forks.forked_from_sandbox_id = ${sandbox.id})`,
      })
      .from(userGallery)
      .innerJoin(user, eq(userGallery.userId, user.id))
      .innerJoin(studentProfile, eq(studentProfile.userId, user.id))
      .innerJoin(sandbox, eq(sandbox.userId, user.id))
      .leftJoin(craftLike, eq(craftLike.sandboxId, sandbox.id))
      .leftJoin(craftPlay, eq(craftPlay.sandboxId, sandbox.id))
      .where(and(eq(userGallery.galleryId, galleryId), isNotNull(sandbox.publishedAt)))
      .groupBy(sandbox.id, user.id, studentProfile.firstName, studentProfile.lastName, studentProfile.avatarColor)
      .orderBy(desc(sandbox.publishedAt));

    const viewer = verifyToken(request);
    if (viewer?.userId && rows.length > 0) {
      const liked = await db
        .select({ sandboxId: craftLike.sandboxId })
        .from(craftLike)
        .where(and(
          eq(craftLike.viewerUserId, viewer.userId),
          inArray(craftLike.sandboxId, rows.map((r) => r.id)),
        ));
      const likedSet = new Set(liked.map((l) => l.sandboxId));
      for (const r of rows) r.viewerLiked = likedSet.has(r.id);
    } else {
      for (const r of rows) r.viewerLiked = false;
    }

    return success({ gallery: g, sandboxes: rows });
  });
}
