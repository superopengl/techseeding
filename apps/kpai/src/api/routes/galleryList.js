import { db } from "../db/index.js";
import {
  sandbox,
  user,
  studentProfile,
  craftLike,
  craftPlay,
  gallery,
  userGallery,
} from "../db/schema.js";
import { eq, and, desc, isNotNull, inArray, sql } from "drizzle-orm";
import { success, error } from "../lib/response.js";
import { parsePagination } from "../lib/parsePagination.js";
import { verifyToken } from "../lib/verifyToken.js";

// Public craft feed. Replaces the old /api/discover route. Two mount points:
//   GET /api/gallery               → every published craft (global)
//   GET /api/gallery/:galleryId    → only crafts by students in this cohort
//
// Both shapes accept ?sort=recent|liked|forked and ?page/?pageSize. The
// :galleryId variant also returns the gallery row so the page header can show
// the cohort name without an extra fetch.
const SORTS = {
  recent: sql`max(${sandbox.publishedAt})`,
  liked: sql`count(distinct ${craftLike.id})`,
  forked: sql`(select count(*)::int from ${sandbox} as forks where forks.forked_from_sandbox_id = ${sandbox.id})`,
};

export function galleryList(fastify) {
  fastify.get("/api/gallery", (request, reply) => handle(request, reply, null));
  fastify.get("/api/gallery/:galleryId", (request, reply) => handle(request, reply, request.params.galleryId));
}

async function handle(request, reply, galleryId) {
  const { page, pageSize, limit, offset } = parsePagination(request.query);
  const sortKey = SORTS[request.query.sort] ? request.query.sort : "recent";
  const orderExpr = sortKey === "recent" ? desc(sandbox.publishedAt) : desc(SORTS[sortKey]);

  let galleryRow = null;
  if (galleryId) {
    const [g] = await db
      .select({ id: gallery.id, name: gallery.name, colorHex: gallery.colorHex })
      .from(gallery)
      .where(eq(gallery.id, galleryId))
      .limit(1);
    if (!g) return error(reply, 404, "NOT_FOUND", "Gallery not found");
    galleryRow = g;
  }

  const baseWhere = galleryId
    ? and(isNotNull(sandbox.publishedAt), eq(userGallery.galleryId, galleryId))
    : isNotNull(sandbox.publishedAt);

  // Both shapes share the same select/join skeleton; the only difference is
  // whether we inner-join through user_gallery for cohort filtering. Aggregate
  // counts stay correct because (user_id, gallery_id) is unique in user_gallery
  // so the inner join is 1:1 against sandbox.userId.
  const baseQuery = db
    .select({
      id: sandbox.id,
      title: sandbox.title,
      publishedAt: sandbox.publishedAt,
      forkedFromSandboxId: sandbox.forkedFromSandboxId,
      ownerUserId: user.id,
      ownerUserName: user.userName,
      ownerFirstName: studentProfile.firstName,
      ownerLastName: studentProfile.lastName,
      ownerAvatarColor: studentProfile.avatarColor,
      likeCount: sql`count(distinct ${craftLike.id})::int`,
      playCount: sql`count(distinct ${craftPlay.id})::int`,
    })
    .from(sandbox)
    .innerJoin(user, eq(user.id, sandbox.userId))
    .leftJoin(studentProfile, eq(studentProfile.userId, user.id))
    .leftJoin(craftLike, eq(craftLike.sandboxId, sandbox.id))
    .leftJoin(craftPlay, eq(craftPlay.sandboxId, sandbox.id));

  const withCohort = galleryId
    ? baseQuery.innerJoin(userGallery, eq(userGallery.userId, user.id))
    : baseQuery;

  const rows = await withCohort
    .where(baseWhere)
    .groupBy(sandbox.id, user.id, studentProfile.firstName, studentProfile.lastName, studentProfile.avatarColor)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  // Annotate each row with viewerLiked so the list page can render the heart
  // in the correct state without an extra request per card. Single batched
  // query against craftLike using the page's sandbox ids.
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

  const countQuery = galleryId
    ? db
        .select({ count: sql`count(distinct ${sandbox.id})::int` })
        .from(sandbox)
        .innerJoin(userGallery, eq(userGallery.userId, sandbox.userId))
        .where(and(isNotNull(sandbox.publishedAt), eq(userGallery.galleryId, galleryId)))
    : db
        .select({ count: sql`count(*)::int` })
        .from(sandbox)
        .where(isNotNull(sandbox.publishedAt));
  const [{ count: total }] = await countQuery;

  return success(
    { crafts: rows, gallery: galleryRow },
    { total, page, pageSize, sort: sortKey },
  );
}
