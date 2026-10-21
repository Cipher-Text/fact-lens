import sharp from 'sharp';

/** Small real images for tests, with hidden metadata where asked. */
export async function makeImage(kind: 'jpeg' | 'png' | 'webp', width = 1200, height = 800, opts: { exif?: boolean; orientation?: number } = {}): Promise<Buffer> {
  let img = sharp({ create: { width, height, channels: 3, background: { r: 200, g: 90, b: 40 } } });
  if (opts.exif) img = img.withExif({ IFD0: { Copyright: 'Hidden Photographer', ImageDescription: 'secret caption' } });
  if (opts.orientation) img = img.withMetadata({ orientation: opts.orientation });
  return kind === 'jpeg' ? img.jpeg().toBuffer() : kind === 'png' ? img.png().toBuffer() : img.webp().toBuffer();
}
