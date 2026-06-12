import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getObjectBytes } from './blob.js';

// Re-hydrate an image we previously persisted so vision lookups on later
// turns can run without the client resending the bytes. Supports both
// file:// (dev) and azblob:// (prod). Returns `{ bytes, mimeType }` or null
// when the bytes can't be fetched. Callers run the bytes through
// downscaleImageForBrain before sending to Brain — encoding to a
// data URL here would force a re-decode every turn.
export default async function loadImageBytes(storageUrl) {
  if (typeof storageUrl !== 'string' || storageUrl.length === 0) return null;

  if (storageUrl.startsWith('file://')) {
    const filePath = fileURLToPath(storageUrl);
    const bytes = await readFile(filePath);
    return { bytes, mimeType: mimeFromPath(filePath) };
  }

  if (storageUrl.startsWith('azblob://')) {
    const obj = await getObjectBytes(storageUrl);
    if (!obj) return null;
    const mime = obj.contentType?.startsWith('image/')
      ? obj.contentType
      : mimeFromPath(storageUrl);
    return { bytes: obj.bytes, mimeType: mime };
  }

  return null;
}

function mimeFromPath(p) {
  const ext = path.extname(p).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}
