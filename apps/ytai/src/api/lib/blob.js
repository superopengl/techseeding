import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

// Shared BlobServiceClient. Uses DefaultAzureCredential so it picks up the
// Container App's system-assigned managed identity in prod and the developer's
// `az login` token locally. No keys ever live in the container.
let cachedService = null;
function getService() {
  if (cachedService) return cachedService;
  const url = process.env.YTAI_STORAGE_ACCOUNT_URL;
  if (!url) {
    throw new Error('YTAI_STORAGE_ACCOUNT_URL not set — call isBlobEnabled() first');
  }
  cachedService = new BlobServiceClient(url, new DefaultAzureCredential());
  return cachedService;
}

// True when the deployment is configured for Azure Blob. When unset, persisters
// fall back to local disk so a dev can work fully offline.
export function isBlobEnabled() {
  return Boolean(process.env.YTAI_STORAGE_ACCOUNT_URL && process.env.YTAI_BLOB_CONTAINER);
}

function containerName() {
  return process.env.YTAI_BLOB_CONTAINER || '';
}

// Per-environment key namespace ("prod", "dev", or any custom stage name).
// Bicep sets this to the deployed stage; local dev defaults to "dev" so a
// misconfigured laptop can't accidentally drop bytes into prod's keyspace.
function blobPrefix() {
  return process.env.YTAI_BLOB_PREFIX || 'dev';
}

// Build a full key under the current environment's namespace.
// e.g. buildKey('images/abc.png') -> 'prod/images/abc.png'
export function buildKey(rest) {
  const prefix = blobPrefix();
  const trimmed = rest.replace(/^\/+/, '');
  return prefix ? `${prefix}/${trimmed}` : trimmed;
}

function buildBlobUrl(key) {
  return `azblob://${containerName()}/${key}`;
}

function parseBlobUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('azblob://')) return null;
  const rest = url.slice('azblob://'.length);
  const slash = rest.indexOf('/');
  if (slash <= 0 || slash === rest.length - 1) return null;
  return { container: rest.slice(0, slash), key: rest.slice(slash + 1) };
}

function getBlobClient(container, key) {
  return getService().getContainerClient(container).getBlockBlobClient(key);
}

function isNotFound(err) {
  return err?.statusCode === 404 || err?.code === 'BlobNotFound' || err?.name === 'RestError' && err?.statusCode === 404;
}

export async function putObject({ key, bytes, contentType }) {
  const container = containerName();
  const client = getBlobClient(container, key);
  await client.uploadData(bytes, {
    blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' },
  });
  return buildBlobUrl(key);
}

export async function objectExists(blobUrl) {
  const parsed = parseBlobUrl(blobUrl);
  if (!parsed) return false;
  try {
    await getBlobClient(parsed.container, parsed.key).getProperties();
    return true;
  } catch (err) {
    if (isNotFound(err)) return false;
    throw err;
  }
}

// Returns { bytes, contentType } or null when the object is missing.
// Used by Eyes/OCR/image-serving paths that need the raw bytes in memory.
export async function getObjectBytes(blobUrl) {
  const parsed = parseBlobUrl(blobUrl);
  if (!parsed) return null;
  try {
    const client = getBlobClient(parsed.container, parsed.key);
    const buf = await client.downloadToBuffer();
    const props = await client.getProperties();
    return { bytes: buf, contentType: props.contentType || 'application/octet-stream' };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

// Mark a blob as orphan via the blob index tag `lifecycle=orphan`. The
// storage account's lifecycle management policy deletes blobs with this tag
// on the next daily sweep — direct equivalent of the old S3 tag-driven
// lifecycle. No-ops for non-azblob URLs (local-dev `file://` paths) and
// missing blobs (404 on tag is fine). Other errors bubble.
export async function markObjectOrphan(blobUrl) {
  const parsed = parseBlobUrl(blobUrl);
  if (!parsed) return;
  try {
    await getBlobClient(parsed.container, parsed.key).setTags({ lifecycle: 'orphan' });
  } catch (err) {
    if (isNotFound(err)) return;
    throw err;
  }
}

// Returns { stream, contentType, contentLength } or null when missing.
// Stream is a Node.js Readable so callers can pipe straight into a Fastify
// reply without buffering the whole object in memory.
export async function getObjectStream(blobUrl) {
  const parsed = parseBlobUrl(blobUrl);
  if (!parsed) return null;
  try {
    const client = getBlobClient(parsed.container, parsed.key);
    const res = await client.download();
    return {
      stream: res.readableStreamBody,
      contentType: res.contentType || 'application/octet-stream',
      contentLength: typeof res.contentLength === 'number' ? res.contentLength : null,
    };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}
