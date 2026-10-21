import { z } from 'zod';
import { httpUrlSchema, idSchema, timestampSchema } from './common';
import { mediaProcessingStates } from './enums';

/** Media library (docs/10). Uploads are images only: JPEG, PNG and WebP. */

export const mediaChannels = ['web', 'social', 'print'] as const;
export const mediaUploadTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** Largest upload accepted, in bytes. The API's limit is configurable but never above this. */
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

/** Public derivatives. The original is never served to readers. */
export const publicMediaVariants = ['thumb', 'card', 'hero'] as const;
export const mediaVariantNames = [...publicMediaVariants, 'original'] as const;
export type MediaVariantName = (typeof mediaVariantNames)[number];

export const mediaVariantSchema = z.object({
  name: z.enum(mediaVariantNames),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mimeType: z.string(),
  byteSize: z.number().int().nonnegative(),
});

export const mediaDetailSchema = z.object({
  id: idSchema,
  originalFilename: z.string().nullable(),
  mimeType: z.string(),
  byteSize: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  processingState: z.enum(mediaProcessingStates),
  altText: z.string().nullable(),
  license: z.string().nullable(),
  attribution: z.string().nullable(),
  rightsOwner: z.string().nullable(),
  rightsNotes: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  rightsExpiresAt: timestampSchema.nullable(),
  permittedChannels: z.array(z.enum(mediaChannels)),
  variants: z.array(mediaVariantSchema),
  uploadedBy: z.string().nullable(),
  createdAt: timestampSchema,
  /** How many stories use it. A used asset cannot be deleted. */
  usageCount: z.number().int().nonnegative(),
});
export type MediaDetail = z.infer<typeof mediaDetailSchema>;

export const mediaListQuerySchema = z.object({
  query: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  cursor: z.string().max(300).optional(),
});
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;

export const mediaListSchema = z.object({ items: z.array(mediaDetailSchema), nextCursor: z.string().nullable() });
export type MediaList = z.infer<typeof mediaListSchema>;

const trimmedOrNull = (max: number) => z.string().trim().max(max).transform((v) => (v === '' ? null : v)).nullable();

/** Only the fields sent are changed; send null (or an empty string) to clear one. */
export const mediaRightsUpdateSchema = z
  .object({
    altText: trimmedOrNull(500),
    license: trimmedOrNull(200),
    attribution: trimmedOrNull(300),
    rightsOwner: trimmedOrNull(300),
    rightsNotes: trimmedOrNull(2000),
    sourceUrl: httpUrlSchema.max(2048).nullable(),
    rightsExpiresAt: timestampSchema.nullable(),
    permittedChannels: z.array(z.enum(mediaChannels)).max(mediaChannels.length),
  })
  .partial()
  .strict()
  .refine((u) => Object.keys(u).length > 0, { message: 'nothing to change' });
export type MediaRightsUpdate = z.infer<typeof mediaRightsUpdateSchema>;

export const publicMediaSchema = z.object({
  id: idSchema,
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  alt: z.string().nullable(),
  attribution: z.string().nullable(),
  license: z.string().nullable(),
  urls: z.object({ thumb: z.string(), card: z.string(), hero: z.string() }),
});
export type PublicMedia = z.infer<typeof publicMediaSchema>;

export const uploadFilenameSchema = z.string().trim().min(1).max(200);
