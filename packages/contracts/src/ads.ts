import { z } from 'zod';
import { httpUrlSchema, idSchema, localeCodeSchema, timestampSchema } from './common';
import { adDeviceTargets, adEventTypes, adFormats, advertiserStatuses, campaignStatuses } from './enums';

/** Advertising transport schemas (Epic G). */

export const advertiserSchema = z.object({
  id: idSchema,
  name: z.string(),
  website: httpUrlSchema.nullable(),
  status: z.enum(advertiserStatuses),
});
export type Advertiser = z.infer<typeof advertiserSchema>;

/** Newsroom-only: adds private commercial contact and billing data. */
export const advertiserAdminSchema = advertiserSchema.extend({
  contactName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  billingInfo: z.string().nullable(),
});
export type AdvertiserAdmin = z.infer<typeof advertiserAdminSchema>;

export const adCampaignSchema = z
  .object({
    id: idSchema,
    advertiserId: idSchema,
    name: z.string(),
    status: z.enum(campaignStatuses),
    startAt: timestampSchema.nullable(),
    endAt: timestampSchema.nullable(),
    budget: z.number().nonnegative().nullable(),
  })
  .refine((c) => !c.startAt || !c.endAt || new Date(c.endAt) > new Date(c.startAt), {
    message: 'endAt must be after startAt',
    path: ['endAt'],
  });
export type AdCampaign = z.infer<typeof adCampaignSchema>;

export const adPlacementSchema = z.object({
  id: idSchema,
  key: z.string().min(1),
  name: z.string(),
  description: z.string().nullable(),
  allowedFormats: z.array(z.enum(adFormats)).min(1),
});
export type AdPlacement = z.infer<typeof adPlacementSchema>;

export const adSchema = z
  .object({
    id: idSchema,
    campaignId: idSchema,
    placementId: idSchema,
    title: z.string(),
    format: z.enum(adFormats),
    mediaAssetId: idSchema.nullable(),
    html: z.string().nullable(),
    targetUrl: httpUrlSchema,
    openInNewTab: z.boolean(),
    priority: z.number().int(),
    weight: z.number().int().min(1),
    deviceTarget: z.enum(adDeviceTargets),
    locale: localeCodeSchema.nullable(),
    categoryIds: z.array(idSchema),
    active: z.boolean(),
  })
  .refine((a) => a.format !== 'image' || a.mediaAssetId !== null, { message: 'image ads need mediaAssetId', path: ['mediaAssetId'] })
  .refine((a) => a.format !== 'html' || (a.html ?? '').trim().length > 0, { message: 'html ads need html', path: ['html'] });
export type Ad = z.infer<typeof adSchema>;

/** Public beacon input. Field lengths match the database caps. */
export const adEventInputSchema = z.object({
  eventType: z.enum(adEventTypes),
  adId: idSchema,
  placementKey: z.string().max(100).optional(),
  path: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
});
export type AdEventInput = z.infer<typeof adEventInputSchema>;
