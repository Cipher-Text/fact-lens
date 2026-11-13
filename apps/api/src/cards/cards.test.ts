import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { startTestApp } from '../test-harness';
import type { MemoryStorage } from '../media/storage';
import { makeImage } from '../media/test-images';
import { CardsService } from './cards.service';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('card rendering (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp<MemoryStorage>>>;
  let cards: CardsService;
  let n = 0;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    cards = t.app.get(CardsService);
  });
  afterAll(() => t?.close());

  /** A card request as T4 will write it: a pending output asset and a generated_card row. */
  async function pendingCard(opts: { permitted?: string[]; expiresAt?: string | null; headline?: string | null } = {}) {
    const news = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], sub: 'rep-1', body: { locale: 'en', title: `Card news ${++n}` } });
    expect(news.status).toBe(201);
    const newsId = news.body.news.id as string;
    const revisionId = (await t.db.pool.query(`SELECT id FROM news_revision WHERE news_id = $1 ORDER BY created_at LIMIT 1`, [newsId])).rows[0].id;

    const photo = await t.upload(await makeImage('jpeg', 1200 + ++n, 900), { filename: 'photo.jpg' });
    expect(photo.status).toBe(201);
    await t.db.pool.query(
      `UPDATE media_asset SET permitted_channels = $2, rights_expires_at = $3 WHERE id = $1`,
      [photo.body.id, opts.permitted ?? ['web', 'social'], opts.expiresAt ?? null],
    );

    const template = (await t.db.pool.query(
      `INSERT INTO card_template (key, version, name, aspect_ratio, width, height, status, created_by)
       VALUES ($1, 1, 'Square', 'square', 400, 400, 'active', 'admin-1') RETURNING id`,
      [`square-${n}`],
    )).rows[0];

    const output = (await t.db.pool.query(
      `INSERT INTO media_asset (object_key, mime_type, byte_size, sha256, processing_state)
       VALUES ($1, 'image/webp', 0, $2, 'pending') RETURNING id, object_key`,
      [`derivatives/card-${n}/card.webp`, `pending-${n}`],
    )).rows[0];

    const card = (await t.db.pool.query(
      `INSERT INTO generated_card (media_asset_id, source_media_asset_id, template_id, news_id, revision_id, locale, crop, text_inputs, created_by)
       VALUES ($1, $2, $3, $4, $5, 'en', '{"x":0,"y":0,"width":1,"height":1}', $6, 'rep-1') RETURNING id`,
      [output.id, photo.body.id, template.id, newsId, revisionId,
        JSON.stringify(opts.headline === null ? {} : { headline: opts.headline ?? 'Headline', byline: 'Byline' })],
    )).rows[0];
    return { cardId: card.id as string, outputId: output.id as string, outputKey: output.object_key as string };
  }

  // A different colour each time: the checksum of a render is unique in the database, so identical renders would collide.
  let shade = 0;
  const webp = (width: number, height: number) => {
    shade += 1;
    const background = '#' + (0x100000 + shade * 7919).toString(16).slice(-6);
    return sharp({ create: { width, height, channels: 3, background } }).webp().toBuffer();
  };

  const auditCount = async (action: string, objectId: string) =>
    Number((await t.db.pool.query(`SELECT count(*) FROM audit_event WHERE action = $1 AND object_id = $2`, [action, objectId])).rows[0].count);

  describe('inputs', () => {
    it('gives the worker the card derivative of the source, the template size and the text', async () => {
      const { cardId } = await pendingCard();
      const inputs = await cards.inputsFor(cardId, 'req-inputs');
      expect(inputs.template).toMatchObject({ aspectRatio: 'square', width: 400, height: 400, status: 'active' });
      expect(inputs.headline).toBe('Headline');
      expect(inputs.byline).toBe('Byline');
      expect(inputs.locale).toBe('en');
      const bytes = Buffer.from(inputs.source.base64, 'base64');
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect((await sharp(bytes).metadata()).format).toBe('webp');
    });

    it('refuses a source whose rights do not permit social, marks the card failed and writes an audit row', async () => {
      const { cardId, outputId } = await pendingCard({ permitted: ['web'] });
      await expect(cards.inputsFor(cardId, 'req-no-social')).rejects.toMatchObject({ status: 422 });
      const state = (await t.db.pool.query(`SELECT processing_state FROM media_asset WHERE id = $1`, [outputId])).rows[0].processing_state;
      expect(state).toBe('failed');
      expect(await auditCount('card.render_failed', outputId)).toBe(1);
    });

    it('refuses a source whose rights have expired', async () => {
      const { cardId } = await pendingCard({ expiresAt: '2020-01-01T00:00:00Z' });
      await expect(cards.inputsFor(cardId, 'req-expired')).rejects.toMatchObject({ status: 422 });
    });

    it('refuses a card with no headline', async () => {
      const { cardId } = await pendingCard({ headline: null });
      await expect(cards.inputsFor(cardId, 'req-no-headline')).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('render', () => {
    it('stores the rendered card, marks the output ready and writes one audit row', async () => {
      const { cardId, outputId, outputKey } = await pendingCard();
      const result = await cards.storeRender(cardId, await webp(400, 400), 'req-render');
      expect(result).toEqual({ created: true });
      const row = (await t.db.pool.query(`SELECT processing_state, width, height, mime_type FROM media_asset WHERE id = $1`, [outputId])).rows[0];
      expect(row).toMatchObject({ processing_state: 'ready', width: 400, height: 400, mime_type: 'image/webp' });
      expect(await t.storage.get(outputKey)).not.toBeNull();
      expect(await auditCount('card.render', outputId)).toBe(1);
    });

    it('is a no-op the second time', async () => {
      const { cardId, outputId } = await pendingCard();
      await cards.storeRender(cardId, await webp(400, 400), 'req-1');
      const again = await cards.storeRender(cardId, await webp(400, 400), 'req-2');
      expect(again).toEqual({ created: false });
      expect(await auditCount('card.render', outputId)).toBe(1);
    });

    it('refuses a render of the wrong size and leaves the output pending', async () => {
      const { cardId, outputId } = await pendingCard();
      await expect(cards.storeRender(cardId, await webp(500, 400), 'req-size')).rejects.toMatchObject({ status: 422 });
      const state = (await t.db.pool.query(`SELECT processing_state FROM media_asset WHERE id = $1`, [outputId])).rows[0].processing_state;
      expect(state).toBe('pending');
    });

    it('refuses bytes that are not WebP', async () => {
      const { cardId } = await pendingCard();
      const png = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#000' } }).png().toBuffer();
      await expect(cards.storeRender(cardId, png, 'req-png')).rejects.toMatchObject({ status: 415 });
    });
  });

  it('answers 404 for an unknown card', async () => {
    await expect(cards.inputsFor('00000000-0000-4000-8000-000000000000', 'req-missing')).rejects.toMatchObject({ status: 404 });
  });
});
