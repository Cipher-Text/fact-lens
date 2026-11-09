import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { NewsPerformanceDetail, NewsPerformanceList, NewsPerformanceRow, PerformanceQuery, PerformanceSummary, PerformanceSummaryQuery } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/pool';
import { LIVE_STATUSES } from '../news/workflow';

const DAY_MS = 24 * 3600 * 1000;
const MAX_SPAN_DAYS = 366;
const SOURCES = ['search', 'social', 'direct', 'internal', 'other'] as const;

/** Today in Dhaka, the newsroom's working day, as YYYY-MM-DD. */
const dhakaToday = (): string => new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (day: string, days: number): string => new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const spanDays = (from: string, to: string): number => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;

/** The period asked for, in Dhaka days, defaulting to the last 30. Checked here so a bad one is a 400. */
function period(from?: string, to?: string): { from: string; to: string } {
  const end = to ?? dhakaToday();
  const start = from ?? addDays(end, -29);
  if (Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) throw new BadRequestException('Not a date');
  if (start > end) throw new BadRequestException('The period starts after it ends');
  if (spanDays(start, end) > MAX_SPAN_DAYS) throw new BadRequestException(`The period is longer than ${MAX_SPAN_DAYS} days`);
  return { from: start, to: end };
}

/**
 * The newsroom's performance reports, read from `news_performance_daily` (and the news items themselves). A
 * view is a first view of a news item, in a language, by a session in 24 hours. Counts lag by up to an hour,
 * because an hour is added once it has finished. Sections, regions and authors are today's, not a snapshot.
 */
@Injectable()
export class AnalyticsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Live news with their views in the period, most or least first. Least read includes news nobody read
   * (they are rows with zero views), and `minAgeDays` keeps new news out of it.
   */
  async list(q: PerformanceQuery): Promise<NewsPerformanceList> {
    const { from, to } = period(q.from, q.to);
    const params: unknown[] = [LIVE_STATUSES, from, to, q.minAgeDays];
    const bind = (value: unknown) => `$${params.push(value)}`;
    const filters: string[] = [];
    if (q.locale) filters.push(`st.locale = ${bind(q.locale)}`);
    if (q.format) filters.push(`n.format = ${bind(q.format)}`);
    if (q.category) {
      filters.push(`EXISTS (SELECT 1 FROM news_category x JOIN category_label l ON l.category_id = x.category_id AND l.locale = st.locale
                             WHERE x.news_id = n.id AND l.slug = ${bind(q.category)})`);
    }
    if (q.region) {
      filters.push(`EXISTS (SELECT 1 FROM news_region x JOIN region_label l ON l.region_id = x.region_id AND l.locale = st.locale
                             WHERE x.news_id = n.id AND l.slug = ${bind(q.region)})`);
    }
    // Fixed fragments, never built from input.
    const metric = q.metric === 'rate' ? 'coalesce(v.views, 0)::numeric / b.days_live' : 'coalesce(v.views, 0)';
    const direction = q.order === 'asc' ? 'ASC' : 'DESC';
    const limit = bind(q.limit + 1);
    const offset = bind(q.offset);
    const { rows } = await this.pool.query(
      `WITH base AS (
         SELECT n.id AS news_id, n.short_id, n.format, n.published_at, st.locale, st.title,
                greatest(1, least($3::date, (now() AT TIME ZONE 'Asia/Dhaka')::date) - greatest($2::date, (n.published_at AT TIME ZONE 'Asia/Dhaka')::date) + 1) AS days_live
           FROM news n JOIN news_translation st ON st.revision_id = n.published_revision_id
          WHERE n.published_revision_id IS NOT NULL AND n.status = ANY ($1)
            AND (n.published_at AT TIME ZONE 'Asia/Dhaka')::date <= $3::date
            AND n.published_at <= now() - make_interval(days => $4::int)
            ${filters.map((f) => `AND ${f}`).join('\n            ')}
       ), v AS (
         SELECT news_id, locale, sum(views)::int AS views, sum(src_search)::int AS src_search, sum(src_social)::int AS src_social,
                sum(src_direct)::int AS src_direct, sum(src_internal)::int AS src_internal, sum(src_other)::int AS src_other
           FROM news_performance_daily WHERE day BETWEEN $2::date AND $3::date GROUP BY news_id, locale
       )
       SELECT b.news_id, b.short_id, b.format, b.published_at, b.locale, b.title, b.days_live::int AS days_live,
              coalesce(v.views, 0) AS views, coalesce(v.src_search, 0) AS src_search, coalesce(v.src_social, 0) AS src_social,
              coalesce(v.src_direct, 0) AS src_direct, coalesce(v.src_internal, 0) AS src_internal, coalesce(v.src_other, 0) AS src_other
         FROM base b LEFT JOIN v ON v.news_id = b.news_id AND v.locale = b.locale
        ORDER BY ${metric} ${direction}, b.published_at DESC, b.news_id, b.locale
        LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    const page = rows.slice(0, q.limit);
    const items: NewsPerformanceRow[] = page.map((r) => ({
      newsId: r.news_id, shortId: r.short_id, locale: r.locale, title: r.title, format: r.format, publishedAt: r.published_at.toISOString(),
      views: r.views, daysLive: r.days_live, viewsPerDay: Math.round((r.views / r.days_live) * 100) / 100,
      sources: { search: r.src_search, social: r.src_social, direct: r.src_direct, internal: r.src_internal, other: r.src_other },
    }));
    return { from, to, items, more: rows.length > q.limit };
  }

  /**
   * Views and live news per group: section, region, format, author or language. A news item counts in every
   * section and region it has, and for every author it credits, so the groups can add up to more than the total.
   */
  async summary(q: PerformanceSummaryQuery): Promise<PerformanceSummary> {
    const { from, to } = period(q.from, q.to);
    const params: unknown[] = [LIVE_STATUSES, from, to];
    const locale = q.locale ? `AND st.locale = $${params.push(q.locale)}` : '';
    // Fixed fragments: the join to the group and what names it.
    const group = {
      category: { join: 'JOIN news_category g ON g.news_id = r.news_id JOIN category c ON c.id = g.category_id LEFT JOIN category_label l ON l.category_id = c.id AND l.locale = \'en\'', key: 'c.key', label: 'coalesce(l.name, c.key)' },
      region: { join: 'JOIN news_region g ON g.news_id = r.news_id JOIN region c ON c.id = g.region_id LEFT JOIN region_label l ON l.region_id = c.id AND l.locale = \'en\'', key: 'c.key', label: 'coalesce(l.name, c.key)' },
      author: { join: 'JOIN news_contributor g ON g.news_id = r.news_id AND g.role = \'author\' JOIN contributor c ON c.id = g.contributor_id', key: 'c.id::text', label: 'c.display_name' },
      format: { join: '', key: 'r.format', label: 'r.format' },
      locale: { join: '', key: 'r.locale', label: 'r.locale' },
    }[q.by];
    const { rows } = await this.pool.query(
      `WITH r AS (
         SELECT n.id AS news_id, n.format, st.locale, coalesce(v.views, 0) AS views
           FROM news n
           JOIN news_translation st ON st.revision_id = n.published_revision_id
           LEFT JOIN (SELECT news_id, locale, sum(views)::int AS views FROM news_performance_daily WHERE day BETWEEN $2::date AND $3::date GROUP BY news_id, locale) v
                  ON v.news_id = n.id AND v.locale = st.locale
          WHERE n.published_revision_id IS NOT NULL AND n.status = ANY ($1)
            AND (n.published_at AT TIME ZONE 'Asia/Dhaka')::date <= $3::date ${locale}
       )
       SELECT ${group.key} AS key, ${group.label} AS label, count(DISTINCT r.news_id)::int AS news, sum(r.views)::int AS views
         FROM r ${group.join}
        GROUP BY ${group.key}, ${group.label}
        ORDER BY sum(r.views) DESC, ${group.label}`,
      params,
    );
    return {
      from, to, by: q.by,
      rows: rows.map((r) => ({ key: r.key, label: r.label, news: r.news, views: r.views, viewsPerNews: r.news > 0 ? Math.round((r.views / r.news) * 100) / 100 : 0 })),
    };
  }

  /** One news item: per language, the totals, a zero-filled daily series, where its views came from and its place in its section. */
  async detail(newsId: string, fromParam?: string, toParam?: string): Promise<NewsPerformanceDetail> {
    const { from, to } = period(fromParam, toParam);
    const news = await this.pool.query<{ short_id: string; published_at: Date | null; published_revision_id: string | null; status: string }>(
      'SELECT short_id, published_at, published_revision_id, status FROM news WHERE id = $1', [newsId]);
    if (!news.rows[0]) throw new NotFoundException('News not found');
    const today = dhakaToday();

    const found = await this.pool.query<{ locale: string }>(
      `SELECT locale FROM news_performance_daily WHERE news_id = $1
        UNION SELECT st.locale FROM news n JOIN news_translation st ON st.revision_id = n.published_revision_id WHERE n.id = $1 ORDER BY locale`, [newsId]);
    const locales: NewsPerformanceDetail['locales'] = [];
    for (const { locale } of found.rows) {
      const perDay = await this.pool.query<{ day: string; views: number }>(
        `SELECT to_char(d, 'YYYY-MM-DD') AS day, coalesce(p.views, 0)::int AS views
           FROM generate_series($2::date, $3::date, interval '1 day') AS d
           LEFT JOIN news_performance_daily p ON p.news_id = $1 AND p.locale = $4 AND p.day = d::date ORDER BY d`, [newsId, from, to, locale]);
      const totals = await this.pool.query(
        `SELECT coalesce(sum(views) FILTER (WHERE day BETWEEN $3::date AND $4::date), 0)::int AS total,
                coalesce(sum(views) FILTER (WHERE day > $5::date - 7 AND day <= $5::date), 0)::int AS last7,
                coalesce(sum(views) FILTER (WHERE day > $5::date - 30 AND day <= $5::date), 0)::int AS last30,
                coalesce(sum(views), 0)::int AS all_time,
                coalesce(sum(src_search) FILTER (WHERE day BETWEEN $3::date AND $4::date), 0)::int AS src_search,
                coalesce(sum(src_social) FILTER (WHERE day BETWEEN $3::date AND $4::date), 0)::int AS src_social,
                coalesce(sum(src_direct) FILTER (WHERE day BETWEEN $3::date AND $4::date), 0)::int AS src_direct,
                coalesce(sum(src_internal) FILTER (WHERE day BETWEEN $3::date AND $4::date), 0)::int AS src_internal,
                coalesce(sum(src_other) FILTER (WHERE day BETWEEN $3::date AND $4::date), 0)::int AS src_other
           FROM news_performance_daily WHERE news_id = $1 AND locale = $2`, [newsId, locale, from, to, today]);
      const t = totals.rows[0];
      const series = perDay.rows;
      const peak = series.reduce<{ day: string; views: number } | null>((best, d) => (d.views > 0 && (!best || d.views > best.views) ? d : best), null);
      const publishedDay = news.rows[0].published_at ? new Date(news.rows[0].published_at.getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10) : from;
      const liveFrom = publishedDay > from ? publishedDay : from;
      const liveTo = to < today ? to : today;
      const daysLive = Math.max(1, liveTo >= liveFrom ? spanDays(liveFrom, liveTo) : 1);
      locales.push({
        locale, total: t.total, last7: t.last7, last30: t.last30, allTime: t.all_time,
        viewsPerDay: Math.round((t.total / daysLive) * 100) / 100, peakDay: peak?.day ?? null,
        sources: Object.fromEntries(SOURCES.map((s) => [s, t[`src_${s}`]])) as NewsPerformanceDetail['locales'][number]['sources'],
        perDay: series, rankInSection: await this.rankInSection(newsId, locale, from, to),
      });
    }
    return { newsId, shortId: news.rows[0].short_id, publishedAt: news.rows[0].published_at?.toISOString() ?? null, from, to, locales };
  }

  /** Its place, by views in the period, among the live news of its primary section that have this language. */
  private async rankInSection(newsId: string, locale: string, from: string, to: string) {
    const { rows } = await this.pool.query(
      `WITH primary_section AS (SELECT category_id FROM news_category WHERE news_id = $1 AND is_primary),
            ranked AS (
              SELECT n.id, rank() OVER (ORDER BY coalesce(v.views, 0) DESC) AS place, count(*) OVER () AS of
                FROM news n
                JOIN news_category nc ON nc.news_id = n.id AND nc.category_id = (SELECT category_id FROM primary_section)
                JOIN news_translation st ON st.revision_id = n.published_revision_id AND st.locale = $2
                LEFT JOIN (SELECT news_id, sum(views)::int AS views FROM news_performance_daily
                            WHERE locale = $2 AND day BETWEEN $3::date AND $4::date GROUP BY news_id) v ON v.news_id = n.id
               WHERE n.published_revision_id IS NOT NULL AND n.status = ANY ($5))
       SELECT r.place::int AS rank, r.of::int AS of, c.key AS section FROM ranked r, category c
        WHERE r.id = $1 AND c.id = (SELECT category_id FROM primary_section)`,
      [newsId, locale, from, to, LIVE_STATUSES],
    );
    return rows[0] ? { section: rows[0].section as string, rank: rows[0].rank as number, of: rows[0].of as number } : null;
  }
}
