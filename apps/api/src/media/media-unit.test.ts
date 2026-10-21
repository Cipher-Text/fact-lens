import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';
import { startFakeS3 } from './fake-s3';
import { ImageRejected, processImage, sniffImage, VARIANT_WIDTHS } from './image';
import { cleanFilename } from './media.service';
import { assertKey, FsStorage, MemoryStorage, S3Storage, type ObjectStorage } from './storage';
import { makeImage } from './test-images';

describe('image sniffing', () => {
  it('reads the type from the bytes, not from a name or header', async () => {
    expect(sniffImage(await makeImage('jpeg', 10, 10))).toBe('jpeg');
    expect(sniffImage(await makeImage('png', 10, 10))).toBe('png');
    expect(sniffImage(await makeImage('webp', 10, 10))).toBe('webp');
  });
  it('refuses everything else', () => {
    for (const bytes of ['<svg xmlns="http://www.w3.org/2000/svg"/>', '<?php echo 1;', 'GIF89a....', '%PDF-1.7', '']) {
      expect(sniffImage(Buffer.from(bytes))).toBeNull();
    }
  });
});

describe('image processing', () => {
  it('makes a thumb, card and hero that are never enlarged, as WebP', async () => {
    const out = await processImage(await makeImage('jpeg', 2000, 1000), 'jpeg');
    expect(out.variants.map((v) => v.name)).toEqual(['thumb', 'card', 'hero']);
    expect(out.variants.map((v) => v.width)).toEqual([VARIANT_WIDTHS.thumb, VARIANT_WIDTHS.card, VARIANT_WIDTHS.hero]);
    expect(out.variants.map((v) => v.height)).toEqual([160, 400, 800]);
    expect(out.variants.every((v) => v.mimeType === 'image/webp')).toBe(true);
    expect(out.original).toMatchObject({ mimeType: 'image/jpeg', width: 2000, height: 1000 });

    const small = await processImage(await makeImage('png', 200, 100), 'png');
    expect(small.variants.map((v) => v.width)).toEqual([200, 200, 200]);
  });

  it('strips hidden metadata from the original and every variant', async () => {
    const upload = await makeImage('jpeg', 600, 400, { exif: true });
    expect((await sharp(upload).metadata()).exif).toBeDefined();
    const out = await processImage(upload, 'jpeg');
    for (const part of [out.original.body, ...out.variants.map((v) => v.body)]) {
      expect((await sharp(part).metadata()).exif).toBeUndefined();
      expect(part.includes(Buffer.from('Hidden Photographer'))).toBe(false);
    }
  });

  it('applies the rotation recorded in the file, so the picture is the right way up', async () => {
    const out = await processImage(await makeImage('jpeg', 600, 300, { orientation: 6 }), 'jpeg');
    expect([out.width, out.height]).toEqual([300, 600]);
    expect(out.variants[0]).toMatchObject({ width: 300, height: 600 });
  });

  it('rejects corrupt, truncated and disguised files', async () => {
    const good = await makeImage('png', 400, 400);
    await expect(processImage(good.subarray(0, 60), 'png')).rejects.toBeInstanceOf(ImageRejected);
    await expect(processImage(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('not really a jpeg')]), 'jpeg')).rejects.toBeInstanceOf(ImageRejected);
    await expect(processImage(Buffer.from('<svg/>'), 'png')).rejects.toBeInstanceOf(ImageRejected);
  });

  it('rejects an image with more pixels than the cap allows, before decoding it', async () => {
    const image = await makeImage('png', 100, 100);
    await expect(processImage(image, 'png', 5_000)).rejects.toBeInstanceOf(ImageRejected);
    await expect(processImage(image, 'png', 10_000)).resolves.toMatchObject({ width: 100, height: 100 });
  });
});

describe('filenames', () => {
  it('keeps only the last part and drops control characters', () => {
    expect(cleanFilename('../../etc/passwd')).toBe('passwd');
    expect(cleanFilename('C:\\Users\\me\\photo.jpg')).toBe('photo.jpg');
    expect(cleanFilename('a\u0000b\nc.png')).toBe('abc.png');
    expect(cleanFilename('   ')).toBe('upload');
    expect(cleanFilename(undefined)).toBe('upload');
    expect(cleanFilename('x'.repeat(500)).length).toBe(200);
  });
});

describe('storage keys', () => {
  it('accept the keys the API makes and refuse anything path-like', () => {
    for (const ok of ['originals/0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11.jpg', 'derivatives/abc/thumb.webp']) expect(() => assertKey(ok)).not.toThrow();
    for (const bad of ['../x', 'a/../b', '/abs', 'a//b', 'a/', 'A.jpg', 'a b', '', 'a\\b', 'x'.repeat(301)]) expect(() => assertKey(bad), bad).toThrow();
  });
});

describe('object storage drivers', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  const exercise = (make: () => Promise<{ storage: ObjectStorage; done?: () => Promise<void> }>) => {
    it('stores, reads back, overwrites and deletes', async () => {
      const { storage, done } = await make();
      try {
        expect(await storage.get('originals/a.png')).toBeNull();
        await storage.put('originals/a.png', png, 'image/png');
        const got = await storage.get('originals/a.png');
        expect(got?.body.equals(png)).toBe(true);
        expect(got?.contentType).toBe('image/png');
        await storage.put('originals/a.png', Buffer.from('v2'), 'image/png');
        expect((await storage.get('originals/a.png'))?.body.toString()).toBe('v2');
        await storage.delete('originals/a.png');
        expect(await storage.get('originals/a.png')).toBeNull();
        await expect(storage.delete('originals/never-existed.png')).resolves.toBeUndefined();
        await expect(storage.put('../escape.png', png, 'image/png')).rejects.toThrow();
        await expect(storage.get('a/../../escape.png')).rejects.toThrow();
      } finally {
        await done?.();
      }
    });
  };

  describe('memory', () => exercise(async () => ({ storage: new MemoryStorage() })));

  describe('filesystem', () => {
    const dirs: string[] = [];
    afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));
    exercise(async () => {
      const dir = await mkdtemp(join(tmpdir(), 'fl-media-'));
      dirs.push(dir);
      return { storage: new FsStorage(dir) };
    });
  });

  describe('S3 client against a fake S3 endpoint', () => {
    exercise(async () => {
      const fake = await startFakeS3('media-bucket');
      const client = new S3Client({
        region: 'auto', endpoint: fake.endpoint, forcePathStyle: true, credentials: { accessKeyId: 'AKIATEST', secretAccessKey: 'secret' },
      });
      return { storage: new S3Storage(client, 'media-bucket'), done: async () => { expect(fake.unsigned).toBe(0); await fake.close(); } };
    });

    it('sends the content type and the exact bytes to the bucket and key', async () => {
      const fake = await startFakeS3('media-bucket');
      const client = new S3Client({ region: 'auto', endpoint: fake.endpoint, forcePathStyle: true, credentials: { accessKeyId: 'AKIATEST', secretAccessKey: 'secret' } });
      await new S3Storage(client, 'media-bucket').put('derivatives/x/thumb.webp', Buffer.from('bytes'), 'image/webp');
      expect(fake.objects.get('derivatives/x/thumb.webp')).toMatchObject({ contentType: 'image/webp' });
      expect(fake.objects.get('derivatives/x/thumb.webp')?.body.toString()).toBe('bytes');
      await fake.close();
    });
  });
});
