import { z } from 'zod';
import { slugSchema } from './common';
import { newsFormats } from './enums';
import { publicNewsListItemSchema } from './taxonomy';

/**
 * Public search (docs/26). The search document is a derived copy of the published text of each live news item,
 * kept in `news_search` by the API. Each language uses its own text configuration: English uses `english`
 * (stemming); every other language uses `simple` until a better one is chosen (docs/26, section 4).
 */
export const searchConfigFor = (locale: string): 'english' | 'simple' => (locale === 'en' ? 'english' : 'simple');

/** The statuses whose published version a reader may see. The same set as the news workflow's live statuses. */
export const searchLiveStatuses = ['PUBLISHED', 'UPDATED', 'CORRECTED'] as const;

/** What the worker asks the API to do for one `search.index` job. */
export const searchIndexRequestSchema = z.object({ operation: z.enum(['upsert', 'delete']) }).strict();
export type SearchIndexRequest = z.infer<typeof searchIndexRequestSchema>;

export const searchIndexResultSchema = z.object({ indexed: z.boolean() });
export type SearchIndexResult = z.infer<typeof searchIndexResultSchema>;

/** Text longer than this is refused with a 400, so a query is never cut in the middle of a word. */
export const SEARCH_MAX_QUERY = 200;

export const publicSearchQuerySchema = z
  .object({
    q: z.string().trim().max(SEARCH_MAX_QUERY).default(''),
    category: slugSchema.optional(),
    region: slugSchema.optional(),
    format: z.enum(newsFormats).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().max(300).optional(),
  })
  .strict();
export type PublicSearchQuery = z.infer<typeof publicSearchQuerySchema>;

export const publicSearchSchema = z.object({
  /** The query as it was searched (trimmed). Empty or one-character queries return no items. */
  query: z.string(),
  items: z.array(publicNewsListItemSchema),
  nextCursor: z.string().nullable(),
});
export type PublicSearch = z.infer<typeof publicSearchSchema>;

/** The editorial trending list (docs/26, section 5): up to six terms in one language, in order, each at most 60 characters. */
export const TRENDING_MAX_TERMS = 6;
export const TRENDING_MAX_TERM = 60;

export const trendingTermsSchema = z
  .object({
    terms: z.array(z.string().trim().min(1).max(TRENDING_MAX_TERM)).max(TRENDING_MAX_TERMS),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    for (const term of value.terms) {
      const key = term.toLocaleLowerCase();
      if (seen.has(key)) ctx.addIssue({ code: 'custom', message: `"${term}" is listed twice`, path: ['terms'] });
      seen.add(key);
    }
  });
export type TrendingTerms = z.infer<typeof trendingTermsSchema>;

/** What readers get: the terms in order. An empty list hides the row. */
export const publicTrendingSchema = z.object({ terms: z.array(z.string()).max(TRENDING_MAX_TERMS) });
export type PublicTrending = z.infer<typeof publicTrendingSchema>;
