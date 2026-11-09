import { z } from 'zod';
import { idSchema, localeCodeSchema, shortIdSchema, slugSchema } from './common';
import { newsFormats } from './enums';
import { publicNewsListItemSchema } from './taxonomy';

/** Where a reader came from, from the referrer's domain only. No address, no path, nothing personal. */
export const viewSources = ['search', 'social', 'direct', 'internal', 'other'] as const;
export type ViewSource = (typeof viewSources)[number];

/**
 * One view of a news item, sent by the public site once the page has been shown. The session id is random and
 * short-lived on the reader's side (not a login, not a fingerprint); the referrer is the domain only.
 */
export const viewBeaconSchema = z.object({
  shortId: shortIdSchema,
  locale: localeCodeSchema,
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, '16 to 64 letters, digits, - or _'),
  referrer: z.string().trim().max(253).optional(),
});
export type ViewBeacon = z.infer<typeof viewBeaconSchema>;

export const mostReadWindows = ['24h', '7d'] as const;

export const mostReadQuerySchema = z.object({
  category: slugSchema.optional(),
  region: slugSchema.optional(),
  format: z.enum(newsFormats).optional(),
  /** Everything but this format (for example opinion). */
  excludeFormat: z.enum(newsFormats).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  /** How far back views count. When too few news items have views, the list widens to 7 days, then to the newest. */
  window: z.enum(mostReadWindows).default('24h'),
});
export type MostReadQuery = z.infer<typeof mostReadQuerySchema>;

/** A public list item with its place in the ranking (1 first). */
export const mostReadItemSchema = publicNewsListItemSchema.extend({ rank: z.number().int().min(1) });
export const mostReadSchema = z.object({
  /** The window the ranking was made from (it can be wider than asked). */
  window: z.enum(mostReadWindows),
  items: z.array(mostReadItemSchema),
});
export type MostRead = z.infer<typeof mostReadSchema>;

// ---- the newsroom's performance reports (analytics.read)

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'a date as YYYY-MM-DD');

export const performanceOrders = ['desc', 'asc'] as const;
/** `views` is the total in the period; `rate` is views a day since the news was live in it, which compares new and old news. */
export const performanceMetrics = ['views', 'rate'] as const;
export const performanceGroups = ['category', 'region', 'format', 'author', 'locale'] as const;

export const performanceQuerySchema = z.object({
  /** The period, in Dhaka days. Both ends included. Defaults to the last 30 days. */
  from: day.optional(),
  to: day.optional(),
  locale: localeCodeSchema.optional(),
  category: slugSchema.optional(),
  region: slugSchema.optional(),
  format: z.enum(newsFormats).optional(),
  metric: z.enum(performanceMetrics).default('views'),
  /** desc is most read, asc is least read (including news nobody read). */
  order: z.enum(performanceOrders).default('desc'),
  /** Only news published at least this many days ago, so new news is not "least read" just for being new. */
  minAgeDays: z.coerce.number().int().min(0).max(3650).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});
export type PerformanceQuery = z.infer<typeof performanceQuerySchema>;

export const sourceCountsSchema = z.object({
  search: z.number().int(), social: z.number().int(), direct: z.number().int(), internal: z.number().int(), other: z.number().int(),
});
export type SourceCounts = z.infer<typeof sourceCountsSchema>;

export const newsPerformanceRowSchema = z.object({
  newsId: idSchema,
  shortId: shortIdSchema,
  locale: localeCodeSchema,
  title: z.string(),
  format: z.enum(newsFormats),
  publishedAt: z.string(),
  /** Views in the period. */
  views: z.number().int(),
  /** Days the news was live in the period (at least 1). */
  daysLive: z.number().int(),
  /** Views a day over those days. */
  viewsPerDay: z.number(),
  sources: sourceCountsSchema,
});
export type NewsPerformanceRow = z.infer<typeof newsPerformanceRowSchema>;

export const newsPerformanceListSchema = z.object({
  from: day, to: day,
  items: z.array(newsPerformanceRowSchema),
  /** True when there are more rows after these. */
  more: z.boolean(),
});
export type NewsPerformanceList = z.infer<typeof newsPerformanceListSchema>;

export const performanceSummaryQuerySchema = z.object({
  from: day.optional(),
  to: day.optional(),
  by: z.enum(performanceGroups).default('category'),
  locale: localeCodeSchema.optional(),
});
export type PerformanceSummaryQuery = z.infer<typeof performanceSummaryQuerySchema>;

export const performanceSummarySchema = z.object({
  from: day, to: day,
  by: z.enum(performanceGroups),
  rows: z.array(z.object({
    key: z.string(),
    label: z.string(),
    /** Live news in the group. */
    news: z.number().int(),
    views: z.number().int(),
    viewsPerNews: z.number(),
  })),
});
export type PerformanceSummary = z.infer<typeof performanceSummarySchema>;

export const newsPerformanceDetailSchema = z.object({
  newsId: idSchema,
  shortId: shortIdSchema,
  publishedAt: z.string().nullable(),
  from: day, to: day,
  /** One entry per language, with a zero for every day in the period. */
  locales: z.array(z.object({
    locale: localeCodeSchema,
    total: z.number().int(),
    last7: z.number().int(),
    last30: z.number().int(),
    allTime: z.number().int(),
    viewsPerDay: z.number(),
    peakDay: day.nullable(),
    sources: sourceCountsSchema,
    perDay: z.array(z.object({ day, views: z.number().int() })),
    /** Its place among the live news of its primary section in the same period (1 first), when it has one. */
    rankInSection: z.object({ section: z.string(), rank: z.number().int(), of: z.number().int() }).nullable(),
  })),
});
export type NewsPerformanceDetail = z.infer<typeof newsPerformanceDetailSchema>;

/** What the rollup of the view counters reports to the worker. */
export const analyticsRollupResultSchema = z.object({
  buckets: z.number().int(),
  skipped: z.number().int(),
  rows: z.number().int(),
});
export type AnalyticsRollupResult = z.infer<typeof analyticsRollupResultSchema>;
