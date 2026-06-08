import { asc, eq } from 'drizzle-orm';
import db from '../db/index.js';
import { sessionDoc, sessionImage } from '../db/schema.js';

// Load the session's current doc with all its pages (one row per page,
// ordered 1..N). Returns null when the session has no doc yet — a text-
// only conversation where Brain answers without the worksheet — or when
// the doc exists but has no pages (both cases collapse into "no JOIN rows").
export default async function loadActiveDoc(currentDocId) {
  if (!currentDocId) return null;
  const rows = await db()
    .select({
      docId: sessionDoc.id,
      kind: sessionDoc.kind,
      pageId: sessionImage.id,
      pageNumber: sessionImage.pageNumber,
      width: sessionImage.width,
      height: sessionImage.height,
      storageUrl: sessionImage.storageUrl
    })
    .from(sessionDoc)
    .innerJoin(sessionImage, eq(sessionImage.docId, sessionDoc.id))
    .where(eq(sessionDoc.id, currentDocId))
    .orderBy(asc(sessionImage.pageNumber));

  if (rows.length === 0) return null;
  return {
    id: rows[0].docId,
    kind: rows[0].kind,
    pages: rows.map((r) => ({
      id: r.pageId,
      pageNumber: r.pageNumber,
      width: r.width,
      height: r.height,
      storageUrl: r.storageUrl
    }))
  };
}
