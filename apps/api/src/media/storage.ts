import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ApiEnv } from '@fact-lens/config';

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface StoredObject {
  body: Buffer;
  contentType: string;
}

/** Where media bytes live. The database holds the metadata and decides who may see what. */
export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

/** Keys are made by the API, but a path-like value is still checked so a bug cannot escape the store. */
const KEY = /^[a-z0-9][a-z0-9/_.-]{0,299}$/;
export function assertKey(key: string): void {
  if (!KEY.test(key) || key.includes('..') || key.includes('//') || key.endsWith('/')) throw new Error(`Invalid storage key: ${key}`);
}

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const typeOf = (key: string) => TYPES[key.split('.').pop() ?? ''] ?? 'application/octet-stream';

/** A folder on disk, for development and tests. Not for production. */
export class FsStorage implements ObjectStorage {
  private readonly root: string;
  constructor(root: string) {
    this.root = resolve(root);
  }
  private path(key: string) {
    assertKey(key);
    const full = resolve(this.root, key);
    if (!full.startsWith(this.root + sep)) throw new Error(`Invalid storage key: ${key}`);
    return full;
  }
  async put(key: string, body: Buffer) {
    const file = this.path(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
  }
  async get(key: string) {
    try {
      return { body: await readFile(this.path(key)), contentType: typeOf(key) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }
  async delete(key: string) {
    await rm(this.path(key), { force: true });
  }
}

/** Any S3-compatible store: Cloudflare R2, MinIO, S3. */
export class S3Storage implements ObjectStorage {
  constructor(private readonly client: S3Client, private readonly bucket: string) {}

  async put(key: string, body: Buffer, contentType: string) {
    assertKey(key);
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }
  async get(key: string) {
    assertKey(key);
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return { body: Buffer.from(await res.Body!.transformToByteArray()), contentType: res.ContentType ?? typeOf(key) };
    } catch (err) {
      // Only a missing object is "not found". A missing bucket is also an HTTP 404, but it is a
      // misconfiguration that must fail loudly, not look like every image having vanished.
      const name = (err as { name?: string }).name;
      if (name === 'NoSuchKey' || name === 'NotFound') return null;
      throw err;
    }
  }
  async delete(key: string) {
    assertKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

/** Held in memory. For tests. */
export class MemoryStorage implements ObjectStorage {
  readonly objects = new Map<string, StoredObject>();
  async put(key: string, body: Buffer, contentType: string) {
    assertKey(key);
    this.objects.set(key, { body, contentType });
  }
  async get(key: string) {
    assertKey(key);
    return this.objects.get(key) ?? null;
  }
  async delete(key: string) {
    assertKey(key);
    this.objects.delete(key);
  }
}

export function createStorage(env: ApiEnv): ObjectStorage {
  if (env.STORAGE_DRIVER === 's3') {
    return new S3Storage(
      new S3Client({
        region: env.S3_REGION, endpoint: env.S3_ENDPOINT, forcePathStyle: env.S3_FORCE_PATH_STYLE,
        // Recent SDK versions add checksums and chunked uploads by default, which several S3-compatible
        // stores reject. Ask for them only where the operation requires one.
        requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
        credentials: { accessKeyId: env.S3_ACCESS_KEY_ID!, secretAccessKey: env.S3_SECRET_ACCESS_KEY! },
      }),
      env.S3_BUCKET!,
    );
  }
  return new FsStorage(env.FS_STORAGE_DIR);
}
