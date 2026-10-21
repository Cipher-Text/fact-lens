import { z } from 'zod';
import { httpUrlSchema, idSchema, timestampSchema } from './common';
import { assignmentRoles, assignmentStatuses, commentStatuses, sourceKinds, sourceRelations, sourceUseTypes, sourceValidationStatuses } from './enums';
import { assignmentSchema, commentSchema, sourceSchema } from './editorial';

/** Comments, assignments, sources and the story timeline (Epic D). All are newsroom-only. */

export const commentCreateSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  /** Defaults to the story's latest revision. */
  revisionId: idSchema.optional(),
  /** Replies are one level deep: the parent must be a top-level comment of the same story. */
  parentId: idSchema.optional(),
});
export type CommentCreate = z.infer<typeof commentCreateSchema>;

export const commentListQuerySchema = z.object({ status: z.enum(commentStatuses).optional() });

export const assignmentCreateSchema = z.object({
  /** Subject identifier of the person, as it appears in their sign-in token. */
  assignee: z.string().trim().min(1).max(200),
  role: z.enum(assignmentRoles),
  dueAt: timestampSchema.optional(),
});
export type AssignmentCreate = z.infer<typeof assignmentCreateSchema>;

export const assignmentQuerySchema = z.object({
  status: z.enum(assignmentStatuses).default('open'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const assignmentWithStorySchema = assignmentSchema.extend({
  assignedBy: z.string().nullable(),
  storyTitles: z.record(z.string(), z.string()),
});
export type AssignmentWithStory = z.infer<typeof assignmentWithStorySchema>;

/** Sources are created from the newsroom. Ingestion fields are set only by connectors. */
export const sourceCreateSchema = z
  .object({
    kind: z.enum(sourceKinds).default('web'),
    title: z.string().trim().min(1).max(500),
    publisher: z.string().trim().max(300).optional(),
    url: httpUrlSchema.max(2048).optional(),
    canonicalUrl: httpUrlSchema.max(2048).optional(),
    archiveUrl: httpUrlSchema.max(2048).optional(),
    publishedAt: timestampSchema.optional(),
    retrievedAt: timestampSchema.optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .strict();
export type SourceCreate = z.infer<typeof sourceCreateSchema>;

export const sourceValidationSchema = z.object({
  status: z.enum(sourceValidationStatuses.filter((s) => s !== 'unvalidated') as ['valid', 'rejected']),
  reason: z.string().trim().min(3).max(500),
});
export type SourceValidation = z.infer<typeof sourceValidationSchema>;

export const storySourceAttachSchema = z.object({
  relation: z.enum(sourceRelations).default('primary'),
  useType: z.enum(sourceUseTypes).default('background'),
  notes: z.string().trim().max(2000).optional(),
});
export type StorySourceAttach = z.infer<typeof storySourceAttachSchema>;

export const attachedSourceSchema = sourceSchema.extend({
  relation: z.enum(sourceRelations),
  useType: z.enum(sourceUseTypes),
  notes: z.string().nullable(),
});
export type AttachedSource = z.infer<typeof attachedSourceSchema>;

export const commentWithThreadSchema = commentSchema;

export const timelineEntrySchema = z.object({
  kind: z.enum(['event', 'revision']),
  at: timestampSchema,
  actor: z.string().nullable(),
  action: z.string(),
  revisionNo: z.number().int().positive().nullable(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  reason: z.string().nullable(),
});
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

const TRACKING = /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|igshid$)/i;

/**
 * Normalizes a URL so the same page deduplicates: lowercase scheme and host, no default port,
 * no fragment, no tracking parameters, sorted query, no trailing slash on the path.
 */
export function canonicalizeUrl(input: string): string {
  const u = new URL(input);
  u.hash = '';
  u.username = '';
  u.password = '';
  for (const key of [...u.searchParams.keys()]) if (TRACKING.test(key)) u.searchParams.delete(key);
  u.searchParams.sort();
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '') || '/';
  const out = u.toString();
  return u.pathname === '/' && !u.search ? out.replace(/\/$/, '') : out;
}
