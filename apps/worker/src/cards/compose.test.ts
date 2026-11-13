import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { calculateCrop, composeCard, type ComposeInput } from './compose.js';

const fixture = (name: string) => readFile(join(__dirname, 'fixtures', name));
const input = async (): Promise<ComposeInput> => ({
  width: 240, height: 240,
  photo: await fixture('photo.jpg'),
  crop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
  headline: 'বাংলা ও English headline', byline: 'FactLens',
  spec: {
    gradient: { from: '#000000', to: '#000000', direction: 'vertical' },
    frame: { color: '#ffffff', width: 4 },
    headlineRegion: { x: 20, y: 150, width: 200, height: 60 },
    bylineRegion: { x: 20, y: 215, width: 200, height: 20 },
  },
});

describe('composeCard', () => {
  it('returns deterministic WebP bytes at the requested dimensions', async () => {
    const data = await input();
    const [first, second] = await Promise.all([composeCard(data), composeCard(data)]);
    expect(first.equals(second)).toBe(true);
    expect((await sharp(first).metadata())).toMatchObject({ format: 'webp', width: 240, height: 240 });
  });

  it('fits a 0.5 by 0.5 crop from a 1000 square source to the expected 500 square crop', () => {
    expect(calculateCrop(1000, 1000, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }, 1, 1)).toEqual({ x: 250, y: 250, width: 500, height: 500 });
  });

  it('keeps headline geometry inside the template region bounds', async () => {
    const data = await input();
    const region = data.spec.headlineRegion;
    expect(region.x).toBeGreaterThanOrEqual(0);
    expect(region.y).toBeGreaterThanOrEqual(0);
    expect(region.x + region.width).toBeLessThanOrEqual(data.width);
    expect(region.y + region.height).toBeLessThanOrEqual(data.height);
    expect(await composeCard(data)).toBeInstanceOf(Buffer);
  });

  it('rejects an out of bounds crop, empty or invalid photo, and oversized headline', async () => {
    const data = await input();
    await expect(composeCard({ ...data, crop: { ...data.crop, x: 0.8 } })).rejects.toThrow(/Crop must/);
    await expect(composeCard({ ...data, photo: Buffer.alloc(0) })).rejects.toThrow(/decodable image/);
    await expect(composeCard({ ...data, photo: Buffer.from('not an image') })).rejects.toThrow(/decodable image/);
    await expect(composeCard({ ...data, headline: 'a'.repeat(301) })).rejects.toThrow(/300 characters/);
  });

  it('ships JPEG and PNG image fixtures', async () => {
    expect((await sharp(await fixture('photo.jpg')).metadata()).format).toBe('jpeg');
    expect((await sharp(await fixture('overlay.png')).metadata()).format).toBe('png');
  });
});
