import { z } from 'zod';
import { httpUrlSchema, idSchema, localeCodeSchema, slugSchema, timestampSchema } from './common';
import {
  assignmentRoles, assignmentStatuses, auditActorTypes, cardAspectRatios, cardTemplateStatuses,
  commentStatuses, contributorKinds, contributorRoles, ingestChannels, mediaProcessingStates,
  revisionMediaRoles, scheduleStatuses, sourceKinds, sourceRelations, sourceUseTypes,
  sourceValidationStatuses, newsStatuses, taxonomyStatuses, translationStatuses,
} from './enums';

/** Transport schemas for the editorial domain. They are not database rows. */

export const newsStatusSchema = z.enum(newsStatuses);
export type NewsStatus = z.infer<typeof newsStatusSchema>;

export const deskSchema = z.object({ id: idSchema, key: z.string(), name: z.string(), active: z.boolean() });
export type Desk = z.infer<typeof deskSchema>;

const labelSchema = z.object({
  locale: localeCodeSchema,
  name: z.string(),
  slug: slugSchema,
  description: z.string().nullable().default(null),
  aliases: z.array(z.string()),
});

export const categorySchema = z.object({
  id: idSchema,
  key: z.string(),
  parentId: idSchema.nullable(),
  position: z.number().int(),
  showInMenu: z.boolean().default(true),
  status: z.enum(taxonomyStatuses),
  labels: z.array(labelSchema),
});
export type Category = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  id: idSchema,
  key: z.string(),
  status: z.enum(taxonomyStatuses),
  labels: z.array(labelSchema),
});
export type Tag = z.infer<typeof tagSchema>;

/** Public byline data. Contact details are never part of this schema. */
export const contributorSchema = z.object({
  id: idSchema,
  kind: z.enum(contributorKinds),
  displayName: z.string(),
  bio: z.string().nullable(),
});
export type Contributor = z.infer<typeof contributorSchema>;

/** Newsroom-only: adds the private contact email. */
export const contributorAdminSchema = contributorSchema.extend({ contactEmail: z.string().nullable() });
export type ContributorAdmin = z.infer<typeof contributorAdminSchema>;

export const mediaAssetSchema = z.object({
  id: idSchema,
  mimeType: z.string(),
  byteSize: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  sha256: z.string(),
  license: z.string().nullable(),
  attribution: z.string().nullable(),
  processingState: z.enum(mediaProcessingStates),
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const newsTranslationSchema = z.object({
  id: idSchema,
  revisionId: idSchema,
  locale: localeCodeSchema,
  title: z.string().min(1),
  dek: z.string().nullable(),
  body: z.unknown(),
  slug: slugSchema,
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  translationStatus: z.enum(translationStatuses),
});
export type NewsTranslation = z.infer<typeof newsTranslationSchema>;

export const newsRevisionSchema = z.object({
  id: idSchema,
  newsId: idSchema,
  revisionNo: z.number().int().positive(),
  changedBy: z.string(),
  createdAt: timestampSchema,
  changedAt: timestampSchema,
  changeReason: z.string().nullable(),
  submittedAt: timestampSchema.nullable(),
  approvedAt: timestampSchema.nullable(),
  isCorrection: z.boolean(),
  aiAssisted: z.boolean(),
});
export type NewsRevision = z.infer<typeof newsRevisionSchema>;

export const newsSchema = z.object({
  id: idSchema,
  canonicalKey: z.string(),
  status: newsStatusSchema,
  categoryId: idSchema.nullable(),
  deskId: idSchema.nullable(),
  publishedRevisionId: idSchema.nullable(),
  publishedAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type News = z.infer<typeof newsSchema>;

export const newsContributorSchema = z.object({
  contributorId: idSchema,
  role: z.enum(contributorRoles),
  position: z.number().int(),
});

export const revisionMediaSchema = z.object({
  mediaAssetId: idSchema,
  role: z.enum(revisionMediaRoles),
  position: z.number().int(),
  caption: z.record(z.string(), z.string()),
});

export const sourceSchema = z.object({
  id: idSchema,
  kind: z.enum(sourceKinds),
  title: z.string(),
  publisher: z.string().nullable(),
  url: httpUrlSchema.nullable(),
  canonicalUrl: httpUrlSchema.nullable(),
  archiveUrl: httpUrlSchema.nullable(),
  publishedAt: timestampSchema.nullable(),
  retrievedAt: timestampSchema.nullable(),
  ingestChannel: z.enum(ingestChannels).nullable(),
  validationStatus: z.enum(sourceValidationStatuses),
});
export type Source = z.infer<typeof sourceSchema>;

export const newsSourceSchema = z.object({
  sourceId: idSchema,
  relation: z.enum(sourceRelations),
  useType: z.enum(sourceUseTypes),
  notes: z.string().nullable(),
});

export const assignmentSchema = z.object({
  id: idSchema,
  newsId: idSchema,
  assignee: z.string(),
  role: z.enum(assignmentRoles),
  status: z.enum(assignmentStatuses),
  dueAt: timestampSchema.nullable(),
  completedAt: timestampSchema.nullable(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const commentSchema = z.object({
  id: idSchema,
  newsId: idSchema,
  revisionId: idSchema.nullable(),
  parentId: idSchema.nullable(),
  author: z.string(),
  body: z.string().min(1),
  status: z.enum(commentStatuses),
  createdAt: timestampSchema,
  resolvedAt: timestampSchema.nullable(),
});
export type Comment = z.infer<typeof commentSchema>;

export const correctionSchema = z.object({
  id: idSchema,
  newsId: idSchema,
  revisionId: idSchema,
  reason: z.string().min(1),
  approvedBy: z.string(),
  approvedAt: timestampSchema,
  /** Public notice text keyed by locale code. */
  notices: z.record(z.string(), z.string().min(1)),
});
export type Correction = z.infer<typeof correctionSchema>;

export const publishingScheduleSchema = z.object({
  id: idSchema,
  newsId: idSchema,
  locale: localeCodeSchema.nullable(),
  channel: z.string(),
  scheduledFor: timestampSchema,
  timeZone: z.string(),
  status: z.enum(scheduleStatuses),
});
export type PublishingSchedule = z.infer<typeof publishingScheduleSchema>;

export const cardTemplateSchema = z.object({
  id: idSchema,
  key: z.string(),
  version: z.number().int().positive(),
  name: z.string(),
  aspectRatio: z.enum(cardAspectRatios),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  status: z.enum(cardTemplateStatuses),
});
export type CardTemplate = z.infer<typeof cardTemplateSchema>;

export const generatedCardSchema = z.object({
  id: idSchema,
  mediaAssetId: idSchema,
  sourceMediaAssetId: idSchema,
  templateId: idSchema,
  newsId: idSchema,
  revisionId: idSchema,
  locale: localeCodeSchema.nullable(),
  createdAt: timestampSchema,
});
export type GeneratedCard = z.infer<typeof generatedCardSchema>;

export const auditEventSchema = z.object({
  id: z.number().int().positive(),
  occurredAt: timestampSchema,
  actorType: z.enum(auditActorTypes),
  actorId: z.string().nullable(),
  action: z.string(),
  objectType: z.string(),
  objectId: z.string(),
  newsId: idSchema.nullable(),
  revisionId: idSchema.nullable(),
  previousState: z.string().nullable(),
  newState: z.string().nullable(),
  reason: z.string().nullable(),
  requestId: z.string().nullable(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const contributorCreateSchema = z.object({
  kind: z.enum(contributorKinds).default('person'),
  displayName: z.string().trim().min(1).max(200),
  bio: z.string().trim().max(2000).nullish(),
});
export type ContributorCreate = z.infer<typeof contributorCreateSchema>;
