import { createHash, randomBytes } from 'node:crypto';
import {
  CreateBucketCommand, DeleteBucketCommand, DeleteObjectCommand, ListObjectsV2Command, S3Client,
} from '@aws-sdk/client-s3';
import { loadApiEnv } from '@fact-lens/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';
import { createStorage, type ObjectStorage } from './storage';
import { makeImage } from './test-images';

/**
 * Runs against a real S3-compatible server (MinIO in CI) when TEST_S3_ENDPOINT is set, so the
 * AWS client, request signing, path-style addressing and error names are checked for real.
 *   TEST_S3_ENDPOINT   e.g. http://localhost:9000
 *   TEST_S3_ACCESS_KEY / TEST_S3_SECRET_KEY   credentials that may create buckets
 *   TEST_S3_REGION     defaults to us-east-1 (MinIO's default region)
 *   TEST_S3_VERIFIES_SIGNATURES=true   the server checks signatures (MinIO does); the local stand-in does not
 */
const endpoint = process.env.TEST_S3_ENDPOINT;
const accessKeyId = process.env.TEST_S3_ACCESS_KEY ?? 'minioadmin';
const secretAccessKey = process.env.TEST_S3_SECRET_KEY ?? 'minioadmin';
const region = process.env.TEST_S3_REGION ?? 'us-east-1';
const verifiesSignatures = process.env.TEST_S3_VERIFIES_SIGNATURES === 'true';
const databaseUrl = process.env.TEST_DATABASE_URL;

/** An admin client for making and emptying the test bucket and for looking inside it. */
const adminClient = () => new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });

/** The storage the API really uses, built by its own factory from the same settings an operator would set. */
const storageFor = (bucket: string, secret = secretAccessKey): ObjectStorage =>
  createStorage(loadApiEnv({
    DATABASE_URL: 'postgres://unused:unused@localhost/unused', REDIS_URL: 'redis://localhost:6379', STORAGE_DRIVER: 's3',
    S3_ENDPOINT: endpoint, S3_REGION: region, S3_BUCKET: bucket, S3_ACCESS_KEY_ID: accessKeyId, S3_SECRET_ACCESS_KEY: secret, S3_FORCE_PATH_STYLE: 'true',
  }));

describe.skipIf(!endpoint)('S3 storage against a real S3-compatible server', () => {
  const bucket = `fl-test-${randomBytes(4).toString('hex')}`;
  const client = adminClient();
  const storage = storageFor(bucket);

  const keysInBucket = async (prefix = '') => {
    const out: string[] = [];
    let token: string | undefined;
    do {
      const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
      out.push(...(res.Contents ?? []).map((o) => o.Key!));
      token = res.NextContinuationToken;
    } while (token);
    return out.sort();
  };

  beforeAll(async () => {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  });
  afterAll(async () => {
    for (const key of await keysInBucket()) await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    await client.send(new DeleteBucketCommand({ Bucket: bucket }));
    client.destroy();
  });

  it('stores, reads back, overwrites and deletes, keeping the content type', async () => {
    const key = `originals/${randomBytes(4).toString('hex')}.png`;
    expect(await storage.get(key)).toBeNull();
    await storage.put(key, Buffer.from('first'), 'image/png');
    const first = await storage.get(key);
    expect(first?.body.toString()).toBe('first');
    expect(first?.contentType).toBe('image/png');
    await storage.put(key, Buffer.from('second'), 'image/webp');
    expect((await storage.get(key))?.contentType).toBe('image/webp');
    expect((await storage.get(key))?.body.toString()).toBe('second');
    await storage.delete(key);
    expect(await storage.get(key)).toBeNull();
    await expect(storage.delete(key)).resolves.toBeUndefined();
  });

  it('keeps binary bytes intact, including a body of a few megabytes', async () => {
    const body = randomBytes(3 * 1024 * 1024);
    const key = `derivatives/${randomBytes(4).toString('hex')}/hero.webp`;
    await storage.put(key, body, 'image/webp');
    const back = await storage.get(key);
    expect(back?.body.length).toBe(body.length);
    expect(createHash('sha256').update(back!.body).digest('hex')).toBe(createHash('sha256').update(body).digest('hex'));
    await storage.delete(key);
  });

  it('treats a slash in the key as a folder, so derivatives list under their prefix', async () => {
    const id = randomBytes(4).toString('hex');
    for (const name of ['thumb', 'card', 'hero']) await storage.put(`derivatives/${id}/${name}.webp`, Buffer.from(name), 'image/webp');
    expect(await keysInBucket(`derivatives/${id}/`)).toEqual([`derivatives/${id}/card.webp`, `derivatives/${id}/hero.webp`, `derivatives/${id}/thumb.webp`]);
    for (const name of ['thumb', 'card', 'hero']) await storage.delete(`derivatives/${id}/${name}.webp`);
    expect(await keysInBucket(`derivatives/${id}/`)).toEqual([]);
  });

  it('fails loudly for a bucket that does not exist, rather than reporting a missing object', async () => {
    const wrong = storageFor(`${bucket}-missing`);
    await expect(wrong.get('originals/a.png')).rejects.toThrow();
    await expect(wrong.put('originals/a.png', Buffer.from('x'), 'image/png')).rejects.toThrow();
  });

  it.runIf(verifiesSignatures)('refuses requests signed with the wrong secret', async () => {
    const bad = storageFor(bucket, 'definitely-not-the-secret');
    await expect(bad.put('originals/denied.png', Buffer.from('x'), 'image/png')).rejects.toMatchObject({ $metadata: { httpStatusCode: 403 } });
    await expect(bad.get('originals/denied.png')).rejects.toThrow();
    expect(await keysInBucket('originals/denied')).toEqual([]);
  });

  describe.skipIf(!databaseUrl)('media upload through the API on this store', () => {
    let t: Awaited<ReturnType<typeof startTestApp<ObjectStorage>>>;
    beforeAll(async () => {
      t = await startTestApp(databaseUrl!, { storage });
    });
    afterAll(() => t?.close());

    it('uploads, serves and deletes an image with its files in the bucket', async () => {
      const bytes = await makeImage('jpeg', 1400, 900, { exif: true });
      const up = await t.upload(bytes, { filename: 'real-store.jpg' });
      expect(up.status).toBe(201);
      const id = up.body.id as string;

      expect(await keysInBucket(`originals/${id}`)).toEqual([`originals/${id}.jpg`]);
      expect(await keysInBucket(`derivatives/${id}/`)).toEqual([`derivatives/${id}/card.webp`, `derivatives/${id}/hero.webp`, `derivatives/${id}/thumb.webp`]);
      const stored = await storage.get(`originals/${id}.jpg`);
      expect(stored?.contentType).toBe('image/jpeg');
      expect(stored?.body.includes(Buffer.from('Hidden Photographer'))).toBe(false);

      const served = await t.fetchFile(`/media/${id}/file?variant=thumb`);
      expect(served.status).toBe(200);
      expect(served.headers['content-type']).toBe('image/webp');
      expect(served.bytes.equals((await storage.get(`derivatives/${id}/thumb.webp`))!.body)).toBe(true);

      const again = await t.upload(bytes, { filename: 'again.jpg' });
      expect(again.status).toBe(200);
      expect(await keysInBucket(`originals/${id}`)).toHaveLength(1);

      expect((await t.call({ method: 'DELETE', url: `/media/${id}`, roles: ['media_editor'] })).status).toBe(204);
      expect(await keysInBucket(`originals/${id}`)).toEqual([]);
      expect(await keysInBucket(`derivatives/${id}/`)).toEqual([]);
      expect((await t.fetchFile(`/media/${id}/file?variant=thumb`)).status).toBe(404);
    });
  });
});
