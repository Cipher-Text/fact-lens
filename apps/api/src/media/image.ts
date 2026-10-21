import sharp from 'sharp';

/**
 * Image handling. Upload bytes are untrusted: the type comes from the bytes, never from the
 * filename or the client's header, every image is decoded and re-encoded (which drops metadata such
 * as GPS position and any data hidden after the image), and decoding is capped in size.
 */

export type ImageKind = 'jpeg' | 'png' | 'webp';

export const MIME: Record<ImageKind, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
export const EXT: Record<ImageKind, string> = { jpeg: 'jpg', png: 'png', webp: 'webp' };

/** Decoding cap: about 40 megapixels. A larger image is refused before any pixel is read. */
const MAX_PIXELS = 40_000_000;

export class ImageRejected extends Error {}

export function sniffImage(buf: Buffer): ImageKind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** The derivatives readers see. Never enlarged: a small image keeps its size in every variant. */
export const VARIANT_WIDTHS = { thumb: 320, card: 800, hero: 1600 } as const;

export interface ProcessedImage {
  kind: ImageKind;
  width: number;
  height: number;
  original: { body: Buffer; mimeType: string; width: number; height: number };
  variants: Array<{ name: keyof typeof VARIANT_WIDTHS; body: Buffer; mimeType: string; width: number; height: number }>;
}

const open = (buf: Buffer, maxPixels: number) => sharp(buf, { limitInputPixels: maxPixels, failOn: 'error', animated: false });

export async function processImage(buf: Buffer, kind: ImageKind, maxPixels: number = MAX_PIXELS): Promise<ProcessedImage> {
  try {
    const meta = await open(buf, maxPixels).metadata();
    if (!meta.width || !meta.height) throw new ImageRejected('The image has no size');
    // EXIF orientation is applied once here, so every derivative is the right way up.
    const upright = await open(buf, maxPixels).rotate().toBuffer({ resolveWithObject: true });
    const base = sharp(upright.data);
    const encoded = await (kind === 'jpeg' ? base.jpeg({ quality: 90 }) : kind === 'png' ? base.png() : base.webp({ quality: 90 })).toBuffer({ resolveWithObject: true });

    const variants = await Promise.all(
      (Object.entries(VARIANT_WIDTHS) as Array<[keyof typeof VARIANT_WIDTHS, number]>).map(async ([name, width]) => {
        const out = await sharp(upright.data).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
        return { name, body: out.data, mimeType: 'image/webp', width: out.info.width, height: out.info.height };
      }),
    );
    return {
      kind, width: encoded.info.width, height: encoded.info.height,
      original: { body: encoded.data, mimeType: MIME[kind], width: encoded.info.width, height: encoded.info.height },
      variants,
    };
  } catch (err) {
    if (err instanceof ImageRejected) throw err;
    // Anything the decoder refuses (corrupt, truncated, too large, not really an image) is rejected the same way.
    throw new ImageRejected('That file could not be read as an image');
  }
}
