import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

export interface Rect { x: number; y: number; width: number; height: number }
export interface ComposeSpec {
  gradient?: { from: string; to: string; direction?: 'vertical' | 'horizontal' };
  frame?: { color: string; width: number };
  headlineRegion: Rect;
  bylineRegion?: Rect;
  fontSize?: number;
  bylineFontSize?: number;
  textColor?: string;
}
export interface ComposeInput {
  width: number; height: number; spec: ComposeSpec; photo: Buffer;
  crop: Rect; headline: string; byline?: string;
}

/** Return the source pixel rectangle after fitting the requested crop to the output ratio. */
export function calculateCrop(sourceWidth: number, sourceHeight: number, crop: Rect, outputWidth: number, outputHeight: number): Rect {
  let x = Math.round(crop.x * sourceWidth), y = Math.round(crop.y * sourceHeight);
  let width = Math.round(crop.width * sourceWidth), height = Math.round(crop.height * sourceHeight);
  const ratio = outputWidth / outputHeight;
  if (width / height > ratio) {
    const fittedWidth = Math.max(1, Math.round(height * ratio));
    x += Math.floor((width - fittedWidth) / 2); width = fittedWidth;
  } else if (width / height < ratio) {
    const fittedHeight = Math.max(1, Math.round(width / ratio));
    y += Math.floor((height - fittedHeight) / 2); height = fittedHeight;
  }
  return { x, y, width, height };
}

export function fitTextRegion(text: string, region: Rect, fontSize: number): { x: number; y: number; width: number; height: number; fontSize: number } {
  const size = Math.min(fontSize, region.height);
  return { x: region.x, y: region.y, width: region.width, height: region.height, fontSize: size };
}

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
const color = (value: string) => {
  if (!/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)) throw new Error(`Invalid template color: ${value}`);
  return value;
};

export async function composeCard(input: ComposeInput): Promise<Buffer> {
  const { width, height, crop, headline, spec } = input;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new Error('Output width and height must be positive integers');
  if (!crop || ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) || crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > 1 || crop.y + crop.height > 1) throw new Error('Crop must be a positive rectangle within 0 to 1');
  if (headline.length > 300) throw new Error('Headline must be 300 characters or fewer');
  if (!Buffer.isBuffer(input.photo) || input.photo.length === 0) throw new Error('Photo must be a decodable image');
  let metadata: sharp.Metadata;
  try { metadata = await sharp(input.photo, { failOn: 'error', limitInputPixels: 40_000_000 }).metadata(); }
  catch { throw new Error('Photo must be a decodable image'); }
  if (!metadata.width || !metadata.height) throw new Error('Photo must be a decodable image');

  const extract = calculateCrop(metadata.width, metadata.height, crop, width, height);
  const background = sharp(input.photo, { failOn: 'error', limitInputPixels: 40_000_000 }).extract({ left: extract.x, top: extract.y, width: extract.width, height: extract.height }).resize(width, height, { fit: 'fill' });
  const overlays: sharp.OverlayOptions[] = [];
  const gradient = spec.gradient;
  const svgParts: string[] = [];
  if (gradient) {
    const from = color(gradient.from), to = color(gradient.to);
    const horizontal = gradient.direction === 'horizontal';
    svgParts.push(`<defs><linearGradient id="g" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}"><stop offset="0" stop-color="${from}" stop-opacity="0.8"/><stop offset="1" stop-color="${to}" stop-opacity="0.8"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/>`);
  }
  const textColor = color(spec.textColor ?? '#ffffff');
const fontPath = (name: string) => join(__dirname, '../../assets/fonts', name);
  const [latin, bengali] = await Promise.all([readFile(fontPath('NotoSans-Regular.ttf')), readFile(fontPath('NotoSansBengali-Regular.ttf'))]);
  const fonts = `<style>@font-face{font-family:FactLens;src:url(data:font/ttf;base64,${latin.toString('base64')})} @font-face{font-family:FactLensBangla;src:url(data:font/ttf;base64,${bengali.toString('base64')})}</style>`;
  const addText = (text: string, region: Rect | undefined, size: number) => {
    if (!region || !text) return;
    if (region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0 || region.x + region.width > width || region.y + region.height > height) throw new Error('Text region must fit inside the output dimensions');
    const fitted = fitTextRegion(text, region, size);
    const lines = text.split('\n');
    const lineHeight = fitted.fontSize * 1.2;
    const lineCount = Math.min(lines.length, Math.max(1, Math.floor(region.height / lineHeight)));
    svgParts.push(`<defs><clipPath id="text-${svgParts.length}"><rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}"/></clipPath></defs><g clip-path="url(#text-${svgParts.length})">`);
    lines.slice(0, lineCount).forEach((line, index) => {
      const y = region.y + fitted.fontSize + index * lineHeight;
      svgParts.push(`<text x="${region.x}" y="${y}" font-family="FactLens,FactLensBangla" font-size="${fitted.fontSize}" fill="${textColor}">${escapeXml(line)}</text>`);
    });
    svgParts.push('</g>');
  };
  addText(headline, spec.headlineRegion, spec.fontSize ?? 48);
  addText(input.byline ?? '', spec.bylineRegion, spec.bylineFontSize ?? 24);
  if (spec.frame) {
    const frameColor = color(spec.frame.color);
    if (!Number.isFinite(spec.frame.width) || spec.frame.width < 0) throw new Error('Frame width must be non-negative');
    if (spec.frame.width > 0) svgParts.push(`<rect x="${spec.frame.width / 2}" y="${spec.frame.width / 2}" width="${width - spec.frame.width}" height="${height - spec.frame.width}" fill="none" stroke="${frameColor}" stroke-width="${spec.frame.width}"/>`);
  }
  if (svgParts.length) {
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${fonts}${svgParts.join('')}</svg>`);
    overlays.push({ input: svg, blend: gradient ? 'over' : 'over' });
  }
  return background.composite(overlays).webp({ quality: 90, effort: 4 }).toBuffer();
}
