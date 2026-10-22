import { z } from 'zod';
import { idSchema, timestampSchema } from './common';
import { feedStatuses, inboxStatuses } from './enums';

/**
 * The source inbox (docs/07, docs/08): RSS feeds an administrator approved, and the items they
 * brought in. The worker fetches; the API stores, de-duplicates and lets editors triage.
 */

const httpUrl = z.string().trim().max(2000).url().refine((u) => /^https?:\/\//i.test(u), 'must start with http:// or https://');

export const feedCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: httpUrl,
  pollMinutes: z.number().int().min(5).max(1440).default(15),
});
export type FeedCreate = z.infer<typeof feedCreateSchema>;

export const feedUpdateSchema = z
  .object({ name: z.string().trim().min(1).max(120), active: z.boolean(), pollMinutes: z.number().int().min(5).max(1440) })
  .partial()
  .strict()
  .refine((u) => Object.keys(u).length > 0, 'nothing to change');
export type FeedUpdate = z.infer<typeof feedUpdateSchema>;

export const feedSchema = z.object({
  id: idSchema,
  name: z.string(),
  url: z.string(),
  active: z.boolean(),
  pollMinutes: z.number().int(),
  lastFetchedAt: timestampSchema.nullable(),
  lastStatus: z.enum(feedStatuses).nullable(),
  lastError: z.string().nullable(),
  /** Items in the inbox with status new. */
  newCount: z.number().int().nonnegative(),
});
export type Feed = z.infer<typeof feedSchema>;

export const inboxItemSchema = z.object({
  id: idSchema,
  feedId: idSchema,
  feedName: z.string(),
  title: z.string(),
  url: z.string().nullable(),
  summary: z.string().nullable(),
  publishedAt: timestampSchema.nullable(),
  retrievedAt: timestampSchema,
  status: z.enum(inboxStatuses),
  newsId: idSchema.nullable(),
});
export type InboxItem = z.infer<typeof inboxItemSchema>;

export const inboxQuerySchema = z.object({
  status: z.enum(inboxStatuses).default('new'),
  feedId: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type InboxQuery = z.infer<typeof inboxQuerySchema>;

export const inboxListSchema = z.object({
  items: z.array(inboxItemSchema),
  /** Items for each status, for the tabs. */
  counts: z.record(z.enum(inboxStatuses), z.number().int().nonnegative()),
});
export type InboxList = z.infer<typeof inboxListSchema>;

/** An editor puts an item aside, or brings it back. Using an item is its own call. */
export const inboxTriageSchema = z.object({ status: z.enum(['new', 'rejected']) });
export type InboxTriage = z.infer<typeof inboxTriageSchema>;

export const inboxUseSchema = z.object({ newsId: idSchema });
export type InboxUse = z.infer<typeof inboxUseSchema>;

// ---- internal: what the worker reports after fetching one feed

export const feedItemInputSchema = z.object({
  guid: z.string().min(1).max(1000),
  title: z.string().trim().min(1).max(500),
  url: httpUrl.optional(),
  summary: z.string().trim().max(1000).optional(),
  publishedAt: timestampSchema.optional(),
});
export type FeedItemInput = z.infer<typeof feedItemInputSchema>;

export const feedIngestSchema = z.object({
  status: z.enum(feedStatuses),
  error: z.string().max(500).optional(),
  etag: z.string().max(500).nullish(),
  lastModified: z.string().max(200).nullish(),
  items: z.array(feedItemInputSchema).max(200).default([]),
});
export type FeedIngest = z.infer<typeof feedIngestSchema>;

export const feedIngestResultSchema = z.object({ inserted: z.number().int(), duplicates: z.number().int(), skipped: z.number().int() });
export type FeedIngestResult = z.infer<typeof feedIngestResultSchema>;
