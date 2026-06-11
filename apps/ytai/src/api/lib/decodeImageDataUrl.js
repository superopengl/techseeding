// Decode `data:image/...;base64,...` into a raw byte Buffer. Returns null
// for malformed or unsupported inputs. Used to validate the per-turn
// annotated canvas the frontend ships when the student has marked the page.
export default function decodeImageDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  try {
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length === 0) return null;
    return { mimeType: match[1], bytes };
  } catch {
    return null;
  }
}
