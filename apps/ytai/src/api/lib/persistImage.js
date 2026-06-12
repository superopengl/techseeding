import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildKey, isBlobEnabled, putObject } from './blob.js';

// Persist a flattened-canvas PNG/JPEG/WebP. In prod the bytes go to
// azblob://container/images/<imageId>.<ext>. In dev (YTAI_STORAGE_ACCOUNT_URL
// unset) they land on local disk under YTAI_IMAGE_DIR so offline work doesn't
// need cloud storage.
//
// One blob per session_image row (the row's UUID is the key) — no cross-row
// dedup. Lets the delete path mark exactly this object as orphan without
// worrying about whether another live row still references the same bytes.
export default async function persistImage({ bytes, imageId, mimeType }) {
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
  const filename = `${imageId}.${ext}`;

  if (isBlobEnabled()) {
    const key = buildKey(`images/${filename}`);
    const storageUrl = await putObject({ key, bytes, contentType: mimeType || 'image/png' });
    return { storageUrl };
  }

  const dir = process.env.YTAI_IMAGE_DIR || './data/images';
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, bytes);
  return { storageUrl: `file://${path.resolve(fullPath)}`, localPath: fullPath };
}
