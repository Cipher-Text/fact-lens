import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase } from './test-db';

const adminUrl = process.env.TEST_DATABASE_URL;

/** The Up part of the migration that moves an old cipher-press menu to the site's menu. */
const up = readFileSync(resolve(__dirname, '../../migrations/1761000000025_site-menu.sql'), 'utf8').split('-- Down Migration')[0]!;

const OLD = [
  ['local', 'Local', 'স্থানীয়'], ['national', 'National', 'জাতীয়'], ['politics', 'Politics', 'রাজনীতি'], ['economy', 'Economy', 'অর্থনীতি'],
  ['business', 'Business', 'ব্যবসা'], ['international', 'International', 'আন্তর্জাতিক'], ['sports', 'Sports', 'খেলা'],
  ['technology', 'Technology', 'প্রযুক্তি'], ['health', 'Health', 'স্বাস্থ্য'],
] as const;

describe.skipIf(!adminUrl)('moving an old menu to the site menu (database)', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>;
  beforeAll(async () => {
    db = await createTestDatabase(adminUrl!);
  });
  afterAll(() => db?.drop());

  const menu = async () => (await db.pool.query(
    `SELECT key, status FROM category ORDER BY position, key`)).rows.map((r) => `${r.key}:${r.status}`);

  it('does nothing to a database without the old menu', async () => {
    await db.pool.query(`INSERT INTO category (key, position) VALUES ('geopolitics', 1)`);
    await db.pool.query(up);
    expect(await menu()).toEqual(['geopolitics:active']);
    await db.pool.query(`DELETE FROM category`);
  });

  it('gives an old database the site menu, keeps what is used or edited, and can run twice', async () => {
    for (const [i, [key, en, bn]] of OLD.entries()) {
      const { rows } = await db.pool.query(`INSERT INTO category (key, position) VALUES ($1, $2) RETURNING id`, [key, i + 1]);
      await db.pool.query(`INSERT INTO category_label (category_id, locale, name, slug, description) VALUES ($1, 'en', $2, $3, 'Old text'), ($1, 'bn-BD', $4, $3, 'পুরনো')`,
        [rows[0].id, key === 'technology' ? 'Tech (edited by an editor)' : en, key, bn]);
    }
    // News uses "sports", so it stays.
    const news = await db.pool.query(`INSERT INTO news (canonical_key) VALUES ('uses-sports') RETURNING id`);
    await db.pool.query(`INSERT INTO news_category (news_id, category_id, is_primary) SELECT $1, id, true FROM category WHERE key = 'sports'`, [news.rows[0].id]);

    await db.pool.query(up);
    expect(await menu()).toEqual([
      'geopolitics:active', 'economy:active', 'security:active', 'technology:active', 'history:active',
      'local:archived', 'national:archived', 'politics:archived', 'business:archived', 'international:archived', 'sports:active', 'health:archived',
    ]);
    const label = async (key: string, locale: string) => (await db.pool.query(
      `SELECT l.name, l.description, l.slug FROM category_label l JOIN category c ON c.id = l.category_id WHERE c.key = $1 AND l.locale = $2`, [key, locale])).rows[0];
    // Still-seeded labels take the site's names and lose the old description; an edited one is left alone.
    expect(await label('economy', 'en')).toEqual({ name: 'Economy and Trade', description: null, slug: 'economy' });
    expect(await label('economy', 'bn-BD')).toMatchObject({ name: 'অর্থনীতি ও বাণিজ্য', description: null });
    expect(await label('technology', 'en')).toMatchObject({ name: 'Tech (edited by an editor)', description: 'Old text' });
    expect(await label('technology', 'bn-BD')).toMatchObject({ name: 'প্রযুক্তি ও কৌশলগত শক্তি', description: null });
    // The new sections have both names and the key as the address.
    expect(await label('security', 'bn-BD')).toEqual({ name: 'নিরাপত্তা ও সংঘাত', description: null, slug: 'security' });
    // Archived ones also leave the menu and keep their labels.
    expect((await db.pool.query(`SELECT show_in_menu FROM category WHERE key = 'local'`)).rows[0].show_in_menu).toBe(false);
    expect(await label('local', 'en')).toMatchObject({ name: 'Local', slug: 'local' });

    const before = await menu();
    await db.pool.query(up);
    expect(await menu()).toEqual(before);
    expect((await db.pool.query(`SELECT count(*)::int AS n FROM category_label WHERE locale = 'en'`)).rows[0].n).toBe(12);
  });
});
