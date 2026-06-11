import decodeImageDataUrl from './decodeImageDataUrl.js';

// Validate the per-turn `{ imageId, dataUrl }` blob the frontend ships when
// the student drew on the active page, and turn it into:
//   - `annotatedByImageId`: Map<imageId, { bytes, mimeType }> for the user
//     message builder to substitute the original photo with.
//   - `annotatedPageNumbers`: page numbers the student annotated this turn,
//     fed into the system prompt so Brain treats the marks as real.
//
// Only honors an annotated image whose imageId belongs to a page of the
// active doc — a stale imageId from a switched-out doc gets dropped, not
// trusted. Returns empty results when the input is missing/malformed/stale
// (with a warn log in the stale/malformed cases).
export default function resolveAnnotatedImage({ annotatedImageRaw, activeDoc, log, sessionId }) {
  const annotatedByImageId = new Map();

  const annotatedImage =
    annotatedImageRaw &&
    typeof annotatedImageRaw === 'object' &&
    typeof annotatedImageRaw.imageId === 'string' &&
    typeof annotatedImageRaw.dataUrl === 'string'
      ? annotatedImageRaw
      : null;

  if (annotatedImage && activeDoc) {
    const pageMatch = activeDoc.pages.find((p) => p.id === annotatedImage.imageId);
    if (pageMatch) {
      const decoded = decodeImageDataUrl(annotatedImage.dataUrl);
      if (decoded) {
        annotatedByImageId.set(pageMatch.id, {
          bytes: decoded.bytes,
          mimeType: decoded.mimeType
        });
      } else {
        log.warn(
          { sessionId, imageId: annotatedImage.imageId },
          'annotatedImage: malformed dataUrl — falling back to original photo'
        );
      }
    } else {
      log.warn(
        { sessionId, imageId: annotatedImage.imageId, activeDocId: activeDoc.id },
        'annotatedImage: imageId not in active doc — ignoring'
      );
    }
  }

  const annotatedPageNumbers = activeDoc
    ? activeDoc.pages.filter((p) => annotatedByImageId.has(p.id)).map((p) => p.pageNumber)
    : [];

  return { annotatedByImageId, annotatedPageNumbers };
}
