import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { startTestApp } from '../test-harness';
import { makeImage } from './test-images';

const adminUrl = process.env.TEST_DATABASE_URL;
const doc = (...content: unknown[]) => ({ type: 'doc', content });
const para = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

describe.skipIf(!adminUrl)('media library (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let deskId: string;
  let authorId: string;
  let n = 0;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!, { maxUploadBytes: 400 * 1024 });
    deskId = (await t.db.pool.query(`SELECT id FROM desk WHERE key = 'opinion'`)).rows[0].id;
    authorId = (await t.db.pool.query(`INSERT INTO contributor (display_name) VALUES ('A. Writer') RETURNING id`)).rows[0].id;
  });
  afterAll(() => t?.close());

  /** A distinct image each time (the library de-duplicates identical bytes). */
  const fresh = (kind: 'jpeg' | 'png' | 'webp' = 'jpeg', width = 1000, opts = {}) => makeImage(kind, width + ++n, 600, opts);
  const asset = async (filename = 'photo.jpg') => {
    const res = await t.upload(await fresh(), { filename });
    expect(res.status).toBe(201);
    return res.body as { id: string };
  };

  describe('upload', () => {
    it('stores a sanitized original and three variants and records who uploaded it', async () => {
      const bytes = await fresh('jpeg', 1800, { exif: true });
      const res = await t.upload(bytes, { filename: '../../Rina/River bank.jpg', roles: ['reporter'], sub: 'rep-1' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        originalFilename: 'River bank.jpg', mimeType: 'image/jpeg', processingState: 'ready', uploadedBy: 'rep-1', usageCount: 0,
        permittedChannels: ['web'], license: null, attribution: null,
      });
      expect(res.body.variants.map((v: any) => v.name)).toEqual(['original', 'thumb', 'card', 'hero']);
      expect(res.body.width).toBeGreaterThan(1800);
      expect(res.body.height).toBe(600);

      const id = res.body.id as string;
      const keys = [...t.storage.objects.keys()].filter((k) => k.includes(id));
      expect(keys.sort()).toEqual([`derivatives/${id}/card.webp`, `derivatives/${id}/hero.webp`, `derivatives/${id}/thumb.webp`, `originals/${id}.jpg`]);
      const original = t.storage.objects.get(`originals/${id}.jpg`)!;
      expect(original.contentType).toBe('image/jpeg');
      expect((await sharp(original.body).metadata()).exif).toBeUndefined();
      expect(original.body.includes(Buffer.from('Hidden Photographer'))).toBe(false);
      expect((await sharp(t.storage.objects.get(`derivatives/${id}/thumb.webp`)!.body).metadata()).width).toBe(320);

      const audit = await t.db.pool.query(`SELECT actor_id FROM audit_event WHERE action = 'media.upload' AND object_id = $1`, [id]);
      expect(audit.rows).toEqual([{ actor_id: 'rep-1' }]);
    });

    it('needs sign-in and the right to edit stories or manage media', async () => {
      const bytes = await fresh();
      expect((await t.upload(bytes, { roles: ['analyst'] })).status).toBe(403);
      expect((await t.upload(bytes, { roles: ['fact_checker'] })).status).toBe(403);
      expect((await t.anonymous('POST', '/media')).statusCode).toBe(401);
      expect((await t.upload(bytes, { roles: ['media_editor'] })).status).toBe(201);
    });

    it('returns the existing asset for the same bytes and stores nothing twice', async () => {
      const bytes = await fresh();
      const first = await t.upload(bytes, { filename: 'a.jpg' });
      const objects = t.storage.objects.size;
      const again = await t.upload(bytes, { filename: 'renamed.jpg', roles: ['media_editor'] });
      expect(again.status).toBe(200);
      expect(again.body.id).toBe(first.body.id);
      expect(t.storage.objects.size).toBe(objects);

      const racing = await fresh();
      const results = await Promise.all([1, 2, 3].map(() => t.upload(racing)));
      expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      const stored = await t.db.pool.query('SELECT count(*)::int AS n FROM media_asset WHERE id = $1', [results[0]!.body.id]);
      expect(stored.rows[0].n).toBe(1);
      expect([...t.storage.objects.keys()].filter((k) => k.includes(results[0]!.body.id))).toHaveLength(4);
    });

    it('trusts the bytes, not the label: a PNG sent as JPEG is stored as a PNG', async () => {
      const res = await t.upload(await fresh('png'), { contentType: 'image/jpeg', filename: 'x.jpg' });
      expect(res.status).toBe(201);
      expect(res.body.mimeType).toBe('image/png');
      expect(t.storage.objects.has(`originals/${res.body.id}.png`)).toBe(true);
    });

    it('refuses what is not an image, what cannot be read, and what is too big', async () => {
      const png = { contentType: 'image/png' };
      expect((await t.upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), png)).status).toBe(415);
      expect((await t.upload(Buffer.from('%PDF-1.7 hello'), png)).status).toBe(415);
      expect((await t.upload(Buffer.alloc(0), png)).status).toBe(415);
      const good = await fresh('png');
      expect((await t.upload(good.subarray(0, 80), png)).status).toBe(422);

      const json = await t.app.inject({
        method: 'POST', url: '/media', payload: { not: 'an image' },
        headers: { authorization: `Bearer ${await t.token(['reporter'])}` },
      });
      expect(json.statusCode).toBe(415);

      const big = await sharp({ create: { width: 2000, height: 2000, channels: 3, background: { r: 0, g: 0, b: 0 }, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).png().toBuffer();
      expect(big.length).toBeGreaterThan(400 * 1024);
      const tooBig = await t.upload(big, png);
      expect(tooBig.status).toBe(413);
      expect(tooBig.body.error.message).toContain('MB');
    });
  });

  describe('library', () => {
    it('lists newest first with stable pages and searches by filename, alt text and credit', async () => {
      const a = await asset('harbour-sunrise.jpg');
      await asset('market-day.jpg');
      await asset('election-rally.jpg');
      await t.call({ method: 'PUT', url: `/media/${a.id}/rights`, roles: ['reporter'], body: { attribution: 'Photo: Karim Hossain', altText: 'Boats at dawn' } });

      const seen: string[] = [];
      let cursor: string | null = null;
      do {
        const page: any = await t.call({ method: 'GET', url: `/media?limit=2${cursor ? `&cursor=${cursor}` : ''}`, roles: ['reporter'] });
        expect(page.status).toBe(200);
        expect(page.body.items.length).toBeLessThanOrEqual(2);
        seen.push(...page.body.items.map((m: any) => m.id));
        cursor = page.body.nextCursor;
      } while (cursor);
      expect(new Set(seen).size).toBe(seen.length);
      const total = (await t.db.pool.query('SELECT count(*)::int AS n FROM media_asset')).rows[0].n;
      expect(seen).toHaveLength(total);

      const names = async (q: string) => (await t.call({ method: 'GET', url: `/media?query=${encodeURIComponent(q)}`, roles: ['reporter'] })).body.items.map((m: any) => m.originalFilename);
      expect(await names('harbour')).toEqual(['harbour-sunrise.jpg']);
      expect(await names('dawn')).toEqual(['harbour-sunrise.jpg']);
      expect(await names('karim')).toEqual(['harbour-sunrise.jpg']);
      expect(await names('%')).toEqual([]);
      expect((await t.call({ method: 'GET', url: '/media?cursor=garbage', roles: ['reporter'] })).status).toBe(400);
      expect((await t.call({ method: 'GET', url: '/media', roles: ['analyst'] })).status).toBe(403);
    });

    it('returns one asset with its usage, and 404 for an unknown one', async () => {
      const a = await asset();
      expect((await t.call({ method: 'GET', url: `/media/${a.id}`, roles: ['reporter'] })).body).toMatchObject({ id: a.id, usageCount: 0 });
      expect((await t.call({ method: 'GET', url: '/media/0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11', roles: ['reporter'] })).status).toBe(404);
      expect((await t.call({ method: 'GET', url: '/media/not-a-uuid', roles: ['reporter'] })).status).toBe(400);
    });
  });

  describe('rights', () => {
    it('records owner, credit, licence, source, expiry and channels, changing only what is sent', async () => {
      const a = await asset();
      const put = (body: unknown, roles = ['reporter']) => t.call({ method: 'PUT', url: `/media/${a.id}/rights`, roles, body });
      const res = await put({
        license: 'CC BY 4.0', attribution: 'Photo: Karim Hossain', rightsOwner: 'Karim Hossain', rightsNotes: 'Sent by email, 2026-10-01',
        sourceUrl: 'https://example.com/karim/photo', rightsExpiresAt: '2030-01-01T00:00:00Z', permittedChannels: ['web', 'social'], altText: 'A river bank',
      });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        license: 'CC BY 4.0', attribution: 'Photo: Karim Hossain', rightsOwner: 'Karim Hossain', sourceUrl: 'https://example.com/karim/photo',
        rightsExpiresAt: '2030-01-01T00:00:00.000Z', permittedChannels: ['web', 'social'], altText: 'A river bank',
      });
      const partial = await put({ license: 'CC0' });
      expect(partial.body).toMatchObject({ license: 'CC0', attribution: 'Photo: Karim Hossain', permittedChannels: ['web', 'social'] });
      const cleared = await put({ attribution: '  ', rightsExpiresAt: null, sourceUrl: null });
      expect(cleared.body).toMatchObject({ attribution: null, rightsExpiresAt: null, sourceUrl: null, license: 'CC0' });

      const audit = await t.db.pool.query(`SELECT metadata FROM audit_event WHERE action = 'media.rights_update' AND object_id = $1 ORDER BY id`, [a.id]);
      expect(audit.rows.map((r) => [...r.metadata.changed].sort())).toEqual([
        ['altText', 'attribution', 'license', 'permittedChannels', 'rightsExpiresAt', 'rightsNotes', 'rightsOwner', 'sourceUrl'], ['license'], ['attribution', 'rightsExpiresAt', 'sourceUrl'],
      ]);
    });

    it('refuses unsafe or unknown input and callers without the right', async () => {
      const a = await asset();
      const put = (body: unknown, roles = ['reporter']) => t.call({ method: 'PUT', url: `/media/${a.id}/rights`, roles, body });
      expect((await put({ sourceUrl: 'javascript:alert(1)' })).status).toBe(400);
      expect((await put({ sourceUrl: 'ftp://example.com/x' })).status).toBe(400);
      expect((await put({ permittedChannels: ['web', 'fax'] })).status).toBe(400);
      expect((await put({ rightsExpiresAt: 'tomorrow' })).status).toBe(400);
      expect((await put({ uploadedBy: 'someone-else' })).status).toBe(400);
      expect((await put({})).status).toBe(400);
      expect((await put({ license: 'CC0' }, ['fact_checker'])).status).toBe(403);
      expect((await t.call({ method: 'PUT', url: '/media/0b6c9a52-6f0c-4f3e-9a0c-7d1a2f6d5e11/rights', roles: ['reporter'], body: { license: 'CC0' } })).status).toBe(404);
    });
  });

  describe('files', () => {
    it('serves any variant to the newsroom, with the right type and nosniff', async () => {
      const a = await asset();
      const thumb = await t.fetchFile(`/media/${a.id}/file?variant=thumb`);
      expect(thumb.status).toBe(200);
      expect(thumb.headers['content-type']).toBe('image/webp');
      expect(thumb.headers['x-content-type-options']).toBe('nosniff');
      expect(thumb.headers['cache-control']).toContain('private');
      expect((await sharp(thumb.bytes).metadata()).width).toBe(320);
      expect((await t.fetchFile(`/media/${a.id}/file?variant=original`)).headers['content-type']).toBe('image/jpeg');
      expect((await t.fetchFile(`/media/${a.id}/file`)).status).toBe(200);
      expect((await t.fetchFile(`/media/${a.id}/file?variant=huge`)).status).toBe(400);
      expect((await t.fetchFile(`/media/${a.id}/file`, ['analyst'])).status).toBe(403);
      expect((await t.anonymous('GET', `/media/${a.id}/file`)).statusCode).toBe(401);
    });

    it('answers 404 when the stored object has gone missing', async () => {
      const a = await asset();
      t.storage.objects.delete(`derivatives/${a.id}/card.webp`);
      expect((await t.fetchFile(`/media/${a.id}/file?variant=card`)).status).toBe(404);
    });
  });

  describe('deleting', () => {
    it('lets a media manager delete an unused asset and removes its stored files', async () => {
      const a = await asset();
      expect((await t.call({ method: 'DELETE', url: `/media/${a.id}`, roles: ['reporter'] })).status).toBe(403);
      expect((await t.call({ method: 'DELETE', url: `/media/${a.id}`, roles: ['media_editor'] })).status).toBe(204);
      expect([...t.storage.objects.keys()].filter((k) => k.includes(a.id))).toEqual([]);
      expect((await t.call({ method: 'GET', url: `/media/${a.id}`, roles: ['reporter'] })).status).toBe(404);
      expect((await t.call({ method: 'DELETE', url: `/media/${a.id}`, roles: ['media_editor'] })).status).toBe(404);
      const audit = await t.db.pool.query(`SELECT 1 FROM audit_event WHERE action = 'media.delete' AND object_id = $1`, [a.id]);
      expect(audit.rowCount).toBe(1);
    });
  });

  describe('using an image in a story', () => {
    async function storyWithImage(slug: string, alt: string | undefined, assetId: string) {
      const created = await t.call({ method: 'POST', url: '/stories', roles: ['reporter'], body: { locale: 'en', title: slug, slug, deskId } });
      const id = created.body.story.id as string;
      const image = { type: 'image', attrs: { mediaAssetId: assetId, ...(alt !== undefined ? { alt } : {}) } };
      const saved = await t.call({ method: 'PUT', url: `/stories/${id}/translations/en`, roles: ['reporter'], body: { title: slug, body: doc(para('Text'), image), slug, expectedVersion: 1 } });
      expect(saved.status).toBe(200);
      await t.call({ method: 'PUT', url: `/stories/${id}/meta`, roles: ['reporter'], body: { contributors: [{ contributorId: authorId, role: 'author' }] } });
      return id;
    }
    const move = (id: string, to: string, roles: string[]) => t.call({ method: 'POST', url: `/stories/${id}/transitions`, roles, body: { to } });
    const publicStory = (slug: string) => t.anonymous('GET', `/public/stories/en/${slug}`);
    const publicImage = (id: string, variant: string) => t.anonymous('GET', `/public/media/${id}/${variant}`);

    it('blocks review without alt text and publishing without rights, then publishes once both are fixed', async () => {
      const a = await asset('lead.jpg');
      const noAlt = await storyWithImage('no-alt-story', undefined, a.id);
      const blocked = await move(noAlt, 'EDITOR_REVIEW', ['reporter']);
      expect(blocked.status).toBe(422);
      expect(blocked.body.error.details.issues).toContain('en: add alt text to every image.');

      const id = await storyWithImage('lead-image-story', 'A river bank at dawn', a.id);
      expect((await move(id, 'EDITOR_REVIEW', ['reporter'])).status).toBe(201);
      expect((await move(id, 'READY', ['fact_checker'])).status).toBe(201);
      const unlicensed = await move(id, 'PUBLISHED', ['managing_editor']);
      expect(unlicensed.status).toBe(422);
      expect(unlicensed.body.error.details.issues).toEqual([`Media ${a.id}: record a license or attribution.`]);
      expect((await publicImage(a.id, 'card')).statusCode).toBe(404);

      await t.call({ method: 'PUT', url: `/media/${a.id}/rights`, roles: ['media_editor'], body: { attribution: 'Photo: Karim Hossain', license: 'CC BY 4.0' } });
      expect((await move(id, 'PUBLISHED', ['managing_editor'])).status).toBe(201);
      expect((await t.call({ method: 'GET', url: `/media/${a.id}`, roles: ['reporter'] })).body.usageCount).toBe(2);
    });

    it('gives readers the image through the public story and public media routes, derivatives only', async () => {
      const a = await asset('public.jpg');
      await t.call({ method: 'PUT', url: `/media/${a.id}/rights`, roles: ['media_editor'], body: { attribution: 'Photo: Karim Hossain', license: 'CC BY 4.0', altText: 'Default alt' } });
      const id = await storyWithImage('public-image-story', 'Boats at dawn', a.id);
      expect((await publicImage(a.id, 'card')).statusCode).toBe(404);
      await move(id, 'EDITOR_REVIEW', ['reporter']);
      await move(id, 'READY', ['fact_checker']);
      await move(id, 'PUBLISHED', ['managing_editor']);

      const story = await publicStory('public-image-story');
      expect(story.statusCode).toBe(200);
      expect(story.json().media).toEqual([{
        id: a.id, width: expect.any(Number), height: 600, alt: 'Default alt', attribution: 'Photo: Karim Hossain', license: 'CC BY 4.0',
        urls: { thumb: `/public/media/${a.id}/thumb`, card: `/public/media/${a.id}/card`, hero: `/public/media/${a.id}/hero` },
      }]);

      const card = await publicImage(a.id, 'card');
      expect(card.statusCode).toBe(200);
      expect(card.headers['content-type']).toBe('image/webp');
      expect(card.headers['cache-control']).toContain('public');
      expect(card.headers['x-content-type-options']).toBe('nosniff');
      expect((await publicImage(a.id, 'original')).statusCode).toBe(404);
      expect((await publicImage(a.id, 'whatever')).statusCode).toBe(404);
    });

    it('withdraws the image when its rights expire or no longer cover the web', async () => {
      const a = await asset('expiring.jpg');
      await t.call({ method: 'PUT', url: `/media/${a.id}/rights`, roles: ['media_editor'], body: { license: 'Licensed', permittedChannels: ['web'] } });
      const id = await storyWithImage('expiring-image-story', 'Alt', a.id);
      await move(id, 'EDITOR_REVIEW', ['reporter']);
      await move(id, 'READY', ['fact_checker']);
      await move(id, 'PUBLISHED', ['managing_editor']);
      expect((await publicImage(a.id, 'thumb')).statusCode).toBe(200);

      await t.db.pool.query(`UPDATE media_asset SET rights_expires_at = now() - interval '1 day' WHERE id = $1`, [a.id]);
      expect((await publicImage(a.id, 'thumb')).statusCode).toBe(404);
      expect((await publicStory('expiring-image-story')).json().media).toEqual([]);

      await t.db.pool.query(`UPDATE media_asset SET rights_expires_at = NULL, permitted_channels = '{social}' WHERE id = $1`, [a.id]);
      expect((await publicImage(a.id, 'thumb')).statusCode).toBe(404);
      await t.db.pool.query(`UPDATE media_asset SET permitted_channels = '{web}' WHERE id = $1`, [a.id]);
      expect((await publicImage(a.id, 'thumb')).statusCode).toBe(200);
    });

    it('refuses to delete an image a story uses, and stops serving it when the story is archived', async () => {
      const a = await asset('in-use.jpg');
      await t.call({ method: 'PUT', url: `/media/${a.id}/rights`, roles: ['media_editor'], body: { license: 'CC0' } });
      const id = await storyWithImage('archived-image-story', 'Alt', a.id);
      await move(id, 'EDITOR_REVIEW', ['reporter']);
      await move(id, 'READY', ['fact_checker']);
      await move(id, 'PUBLISHED', ['managing_editor']);

      const del = await t.call({ method: 'DELETE', url: `/media/${a.id}`, roles: ['media_editor'] });
      expect(del.status).toBe(409);
      expect(del.body.error.details.reason).toBe('in_use');
      expect(t.storage.objects.has(`originals/${a.id}.jpg`)).toBe(true);

      await t.call({ method: 'POST', url: `/stories/${id}/transitions`, roles: ['managing_editor'], body: { to: 'ARCHIVED', reason: 'Withdrawn' } });
      expect((await publicImage(a.id, 'thumb')).statusCode).toBe(404);
    });
  });
});

