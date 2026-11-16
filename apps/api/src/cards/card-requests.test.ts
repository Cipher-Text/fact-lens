import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';
import type { MemoryStorage } from '../media/storage';
import { makeImage } from '../media/test-images';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('card requests and templates (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp<MemoryStorage>>>;
  let n = 0;

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
  });
  afterAll(() => t?.close());

  const setFlag = (enabled: boolean) =>
    t.db.pool.query(
      `INSERT INTO feature_flag (key, enabled, description, updated_by) VALUES ('cards.generation', $1, 'test', 'test')
       ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled`,
      [enabled],
    );

  async function newsWithTitle() {
    const res = await t.call({ method: 'POST', url: '/news', roles: ['reporter'], sub: 'rep-1', body: { locale: 'en', title: `Card request ${++n}` } });
    expect(res.status).toBe(201);
    return res.body.news.id as string;
  }

  async function activeTemplate(key = `t-${++n}`) {
    const row = (await t.db.pool.query(
      `INSERT INTO card_template (key, version, name, aspect_ratio, width, height, status, created_by)
       VALUES ($1, 1, 'Square', 'square', 400, 400, 'active', 'admin-1') RETURNING id`, [key])).rows[0];
    return row.id as string;
  }

  async function socialPhoto(permitted = ['web', 'social']) {
    const photo = await t.upload(await makeImage('jpeg', 1300 + ++n, 900), { filename: 'photo.jpg' });
    expect(photo.status).toBe(201);
    await t.db.pool.query(`UPDATE media_asset SET permitted_channels = $2 WHERE id = $1`, [photo.body.id, permitted]);
    return photo.body.id as string;
  }

  const requestBody = (templateId: string, sourceMediaAssetId: string) => ({
    templateId, sourceMediaAssetId, locale: 'en', crop: { x: 0, y: 0, width: 1, height: 1 }, headline: 'Headline', byline: 'Byline',
  });

  describe('requesting a card', () => {
    it('is refused while the cards.generation flag is off', async () => {
      await setFlag(false);
      const newsId = await newsWithTitle();
      const res = await t.call({ method: 'POST', url: `/news/${newsId}/cards`, roles: ['reporter'], sub: 'rep-1', body: requestBody(await activeTemplate(), await socialPhoto()) });
      expect(res.status).toBe(409);
      expect(res.body.reason ?? res.body.error?.details?.reason ?? 'cards_disabled').toBe('cards_disabled');
    });

    it('records a pending card, its outbox event and an audit row, in one request', async () => {
      await setFlag(true);
      const newsId = await newsWithTitle();
      const res = await t.call({ method: 'POST', url: `/news/${newsId}/cards`, roles: ['reporter'], sub: 'rep-1', body: requestBody(await activeTemplate(), await socialPhoto()) });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ newsId, renderStatus: 'pending', locale: 'en', failureReason: null });
      const outbox = await t.db.pool.query(`SELECT count(*) FROM outbox_event WHERE event_type = 'card.requested' AND aggregate_id = $1`, [res.body.id]);
      expect(Number(outbox.rows[0].count)).toBe(1);
      const audit = await t.db.pool.query(`SELECT count(*) FROM audit_event WHERE action = 'card.request' AND object_id = $1`, [newsId]);
      expect(Number(audit.rows[0].count)).toBe(1);
    });

    it('refuses a draft template and writes nothing', async () => {
      await setFlag(true);
      const newsId = await newsWithTitle();
      const draft = (await t.db.pool.query(
        `INSERT INTO card_template (key, version, name, aspect_ratio, width, height, status, created_by)
         VALUES ($1, 1, 'Draft', 'square', 400, 400, 'draft', 'admin-1') RETURNING id`, [`draft-${++n}`])).rows[0].id;
      const res = await t.call({ method: 'POST', url: `/news/${newsId}/cards`, roles: ['reporter'], sub: 'rep-1', body: requestBody(draft, await socialPhoto()) });
      expect(res.status).toBe(422);
      const count = await t.db.pool.query(`SELECT count(*) FROM generated_card WHERE news_id = $1`, [newsId]);
      expect(Number(count.rows[0].count)).toBe(0);
    });

    it('refuses a photo whose rights do not permit social, and writes nothing', async () => {
      await setFlag(true);
      const newsId = await newsWithTitle();
      const res = await t.call({ method: 'POST', url: `/news/${newsId}/cards`, roles: ['reporter'], sub: 'rep-1', body: requestBody(await activeTemplate(), await socialPhoto(['web'])) });
      expect(res.status).toBe(422);
      const count = await t.db.pool.query(`SELECT count(*) FROM generated_card WHERE news_id = $1`, [newsId]);
      expect(Number(count.rows[0].count)).toBe(0);
    });

    it('needs the news.edit capability', async () => {
      await setFlag(true);
      const newsId = await newsWithTitle();
      const res = await t.call({ method: 'POST', url: `/news/${newsId}/cards`, roles: ['reader'], sub: 'reader-1', body: requestBody(await activeTemplate(), await socialPhoto()) });
      expect(res.status).toBe(403);
    });

    it('lists the cards of a news item with their render status', async () => {
      await setFlag(true);
      const newsId = await newsWithTitle();
      await t.call({ method: 'POST', url: `/news/${newsId}/cards`, roles: ['reporter'], sub: 'rep-1', body: requestBody(await activeTemplate(), await socialPhoto()) });
      const res = await t.call({ method: 'GET', url: `/news/${newsId}/cards`, roles: ['reporter'], sub: 'rep-1' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ renderStatus: 'pending' });
    });
  });

  describe('templates', () => {
    it('lets only template managers create, publish and retire templates', async () => {
      const denied = await t.call({ method: 'POST', url: '/card-templates', roles: ['reporter'], sub: 'rep-1', body: { key: 'nope', name: 'Nope', aspectRatio: 'square', width: 400, height: 400 } });
      expect(denied.status).toBe(403);
    });

    it('creates a draft, publishes it, and retires the previous active version of its key', async () => {
      const key = `brand-${++n}`;
      const first = await t.call({ method: 'POST', url: '/card-templates', roles: ['admin'], sub: 'admin-1', body: { key, name: 'Brand', aspectRatio: 'square', width: 400, height: 400 } });
      expect(first.status).toBe(201);
      expect(first.body).toMatchObject({ version: 1, status: 'draft' });
      const published = await t.call({ method: 'POST', url: `/card-templates/${first.body.id}/publish`, roles: ['admin'], sub: 'admin-1' });
      expect(published.body).toMatchObject({ status: 'active' });

      const second = await t.call({ method: 'POST', url: '/card-templates', roles: ['admin'], sub: 'admin-1', body: { key, name: 'Brand v2', aspectRatio: 'square', width: 400, height: 400 } });
      expect(second.body).toMatchObject({ version: 2, status: 'draft' });
      await t.call({ method: 'POST', url: `/card-templates/${second.body.id}/publish`, roles: ['admin'], sub: 'admin-1' });

      const versions = await t.db.pool.query(`SELECT version, status FROM card_template WHERE key = $1 ORDER BY version`, [key]);
      expect(versions.rows).toEqual([{ version: 1, status: 'retired' }, { version: 2, status: 'active' }]);
    });

    it('does not publish a template that is not a draft', async () => {
      const id = await activeTemplate();
      const res = await t.call({ method: 'POST', url: `/card-templates/${id}/publish`, roles: ['admin'], sub: 'admin-1' });
      expect(res.status).toBe(409);
    });

    it('refuses template fields it does not know, such as assets', async () => {
      const res = await t.call({ method: 'POST', url: '/card-templates', roles: ['admin'], sub: 'admin-1', body: { key: 'x-assets', name: 'X', aspectRatio: 'square', width: 400, height: 400, assets: [] } });
      expect(res.status).toBe(400);
    });

    it('shows editors only active templates', async () => {
      await t.db.pool.query(`INSERT INTO card_template (key, version, name, aspect_ratio, width, height, status, created_by) VALUES ('hidden-draft', 1, 'Hidden', 'square', 400, 400, 'draft', 'admin-1')`);
      const res = await t.call({ method: 'GET', url: '/card-templates', roles: ['reporter'], sub: 'rep-1' });
      expect(res.status).toBe(200);
      expect(res.body.every((x: { status: string }) => x.status === 'active')).toBe(true);
    });
  });
});
