import sharp from 'sharp';

// Cap the longest edge before sending an image to Brain. The vision
// encoders we target (Gemma 4, Gemini, GPT-4o, Claude) all tile the input
// at a fixed resolution and bill per tile, so anything beyond ~1.5K
// pixels gets re-tiled into more tokens without giving the model more
// useful detail — and a 12 MP phone photo blows the context window on
// turn 2 because turn 1's history is now also sitting in the prompt.
// 1568 is the value Anthropic and OpenAI both recommend as the
// accuracy/cost crossover for document-style images.
const MAX_EDGE = 1568;

// JPEG quality. 85 keeps handwriting and printed worksheet text
// legible while shrinking a typical photo by ~6×. Higher than this
// stops giving Brain useful extra detail; lower starts smudging
// pencil marks.
const JPEG_QUALITY = 85;

// Re-encode an image to a Brain-friendly size and format. Returns
// `{ bytes, mimeType: 'image/jpeg' }`. On decode failure (corrupt
// upload, unsupported format) returns the original bytes + mime so
// the turn still goes out — a fat upload beats a dropped one.
export default async function downscaleImageForBrain(bytes, mimeType, log) {
  try {
    const image = sharp(bytes, { failOn: 'none' });
    const meta = await image.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const needsResize = w > MAX_EDGE || h > MAX_EDGE;
    let pipe = image;
    if (needsResize) {
      pipe = pipe.resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    const out = await pipe.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    log?.info?.(
      {
        origMime: mimeType,
        origW: w,
        origH: h,
        origBytes: bytes.length,
        outBytes: out.length,
        resized: needsResize
      },
      'downscaleImageForBrain: re-encoded page image'
    );
    return { bytes: out, mimeType: 'image/jpeg' };
  } catch (err) {
    log?.warn?.(
      { err: err?.message, origMime: mimeType, origBytes: bytes.length },
      'downscaleImageForBrain: decode failed — sending original bytes'
    );
    return { bytes, mimeType };
  }
}
