import { z } from 'zod';
import { idSchema, localeCodeSchema, timestampSchema } from './common';
import { cardAspectRatios, cardTemplateStatuses, generatedCardRenderStatuses } from './enums';
import { generatedCardSchema } from './editorial';

/** Branded photocards and posters (docs/10). Deterministic compositing, never generative AI (ADR-010). */

export const cropSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().gt(0).max(1),
    height: z.number().gt(0).max(1),
  })
  .strict()
  .refine((c) => c.x + c.width <= 1 && c.y + c.height <= 1, { message: 'The crop must lie inside the photo' });
export type Crop = z.infer<typeof cropSchema>;

/** Body of POST /news/:id/cards. The API checks the source rights, the template status and the translation. */
export const cardRequestSchema = z
  .object({
    templateId: idSchema,
    sourceMediaAssetId: idSchema,
    locale: localeCodeSchema,
    crop: cropSchema,
    headline: z.string().trim().min(1).max(300),
    byline: z.string().trim().max(200).optional(),
  })
  .strict();
export type CardRequest = z.infer<typeof cardRequestSchema>;

/** A card as the newsroom lists it on a news item. `renderStatus` is the output asset's status. */
export const generatedCardListItemSchema = generatedCardSchema.extend({
  renderStatus: z.enum(generatedCardRenderStatuses),
  failureReason: z.string().nullable(),
  createdAt: timestampSchema,
});
export type GeneratedCardListItem = z.infer<typeof generatedCardListItemSchema>;

/** What the worker receives from GET /internal/cards/:id/inputs. Bytes travel base64-encoded in JSON. */
export const cardRenderInputsSchema = z
  .object({
    template: z.object({
      aspectRatio: z.enum(cardAspectRatios),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      status: z.enum(cardTemplateStatuses),
      spec: z.record(z.string(), z.unknown()),
    }),
    source: z.object({ contentType: z.literal('image/webp'), base64: z.string().min(1) }),
    crop: cropSchema,
    locale: localeCodeSchema,
    headline: z.string().min(1).max(300),
    byline: z.string().max(200).nullable(),
  })
  .strict();
export type CardRenderInputs = z.infer<typeof cardRenderInputsSchema>;

export const CARD_RENDER_MAX_BYTES = 5 * 1024 * 1024;
