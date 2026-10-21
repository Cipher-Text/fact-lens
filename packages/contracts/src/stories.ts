import { z } from 'zod';
import { tiptapBodySchema } from './body';
import { contributorSchema, mediaAssetSchema, storyRevisionSchema, storySchema, storyTranslationSchema } from './editorial';
import { idSchema, localeCodeSchema, slugSchema, timestampSchema } from './common';
import { contributorRoles, storyStatuses } from './enums';

export const storyCreateSchema = z.object({
  locale: localeCodeSchema,
  title: z.string().trim().min(1).max(300),
  /** Derived from the title when omitted. */
  slug: slugSchema.optional(),
  deskId: idSchema.nullish(),
  categoryId: idSchema.nullish(),
});
export type StoryCreate = z.infer<typeof storyCreateSchema>;

export const translationSaveSchema = z.object({
  title: z.string().trim().min(1).max(300),
  dek: z.string().trim().max(600).nullish(),
  body: tiptapBodySchema,
  slug: slugSchema,
  seoTitle: z.string().trim().max(120).nullish(),
  seoDescription: z.string().trim().max(320).nullish(),
  /** Version of the saved translation this edit started from; null when creating it. */
  expectedVersion: z.number().int().positive().nullable(),
});
export type TranslationSave = z.infer<typeof translationSaveSchema>;

export const storyMetaSchema = z
  .object({
    deskId: idSchema.nullable(),
    categoryId: idSchema.nullable(),
    contributors: z
      .array(z.object({ contributorId: idSchema, role: z.enum(contributorRoles), position: z.number().int().min(0).default(0) }))
      .max(50),
  })
  .partial()
  .refine((m) => Object.keys(m).length > 0, { message: 'nothing to change' });
export type StoryMeta = z.infer<typeof storyMetaSchema>;

export const revisionCreateSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export type RevisionCreate = z.infer<typeof revisionCreateSchema>;

export const transitionRequestSchema = z
  .object({
    to: z.enum(storyStatuses),
    reason: z.string().trim().min(3).max(500).optional(),
    schedule: z.object({ scheduledFor: timestampSchema, timeZone: z.string().min(1).max(64) }).optional(),
  })
  .refine((t) => (t.to === 'SCHEDULED') === (t.schedule !== undefined), {
    message: 'schedule is required for SCHEDULED and not allowed otherwise',
    path: ['schedule'],
  });
export type TransitionRequest = z.infer<typeof transitionRequestSchema>;

export const correctionCreateSchema = z.object({
  reason: z.string().trim().min(3).max(500),
  /** Public notice text per locale. At least one locale. */
  notices: z.record(localeCodeSchema, z.string().trim().min(1).max(1000)).refine((n) => Object.keys(n).length > 0, 'at least one notice'),
});
export type CorrectionCreate = z.infer<typeof correctionCreateSchema>;

export const storyListQuerySchema = z.object({
  status: z.enum(storyStatuses).optional(),
  deskId: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().max(300).optional(),
});
export type StoryListQuery = z.infer<typeof storyListQuerySchema>;

export const storySummarySchema = storySchema.extend({ titles: z.record(z.string(), z.string()) });
export type StorySummary = z.infer<typeof storySummarySchema>;

export const storyListSchema = z.object({ items: z.array(storySummarySchema), nextCursor: z.string().nullable() });
export type StoryList = z.infer<typeof storyListSchema>;

/** A move the story could make from its current state, and whether the caller may make it. */
export const availableTransitionSchema = z.object({
  to: z.enum(storyStatuses),
  /** The capability that gates this move for this story's desk. */
  capability: z.string(),
  permitted: z.boolean(),
  reasonRequired: z.boolean(),
  needsSchedule: z.boolean(),
});
export type AvailableTransition = z.infer<typeof availableTransitionSchema>;

export const storyDetailSchema = z.object({
  story: storySchema,
  /** Latest revision: the one being edited, or the last one saved. */
  revision: storyRevisionSchema,
  editable: z.boolean(),
  translations: z.array(storyTranslationSchema.extend({ version: z.number().int().positive(), updatedAt: timestampSchema })),
  contributors: z.array(z.object({ contributor: contributorSchema, role: z.enum(contributorRoles), position: z.number().int() })),
  media: z.array(mediaAssetSchema.extend({ role: z.string() })),
  revisionCount: z.number().int().positive(),
  /** Open review comments. Visible at every hand-off so they are not missed (docs/06). */
  openCommentCount: z.number().int().nonnegative(),
  /** What the caller can do next, so a client never repeats the workflow rules. */
  transitions: z.array(availableTransitionSchema),
});
export type StoryDetail = z.infer<typeof storyDetailSchema>;

export const publicStorySchema = z.object({
  id: idSchema,
  locale: localeCodeSchema,
  slug: slugSchema,
  title: z.string(),
  dek: z.string().nullable(),
  body: tiptapBodySchema,
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  publishedAt: timestampSchema,
  updatedAt: timestampSchema,
  contributors: z.array(z.object({ contributor: contributorSchema, role: z.enum(contributorRoles) })),
  alternates: z.array(z.object({ locale: localeCodeSchema, slug: slugSchema })),
  corrections: z.array(z.object({ approvedAt: timestampSchema, notice: z.string() })),
});
export type PublicStory = z.infer<typeof publicStorySchema>;
