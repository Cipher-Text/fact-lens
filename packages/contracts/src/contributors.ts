import { z } from 'zod';
import { idSchema } from './common';
import { contributorAdminSchema, contributorSchema } from './editorial';
import { contributorKinds } from './enums';
import { socialLinksSchema, socialNetworks } from './configuration';
import { publicMediaSchema } from './media';

/** The accounts a byline links to: the same networks and rules as the site's own social links. */
export const contributorSocialLinksSchema = socialLinksSchema;

/** What the newsroom sees of a contributor: the profile, the private contact email and how often they are credited. */
export const contributorProfileSchema = contributorAdminSchema.extend({
  imageId: idSchema.nullable(),
  socialLinks: z.record(z.enum(socialNetworks), z.string().nullable()),
  /** News items that credit this person. */
  usageCount: z.number().int().nonnegative(),
});
export type ContributorProfile = z.infer<typeof contributorProfileSchema>;

export const contributorProfileListSchema = z.object({ items: z.array(contributorProfileSchema), nextCursor: z.string().nullable() });
export type ContributorProfileList = z.infer<typeof contributorProfileListSchema>;

const email = z.string().trim().email().max(320);

export const contributorSaveSchema = z.object({
  kind: z.enum(contributorKinds),
  displayName: z.string().trim().min(1).max(200),
  bio: z.string().trim().max(2000).nullish(),
  contactEmail: email.nullish(),
  /** A picture from the media library. */
  imageId: idSchema.nullish(),
  socialLinks: contributorSocialLinksSchema.optional(),
});
export type ContributorSave = z.infer<typeof contributorSaveSchema>;

export const contributorCreateSchema = contributorSaveSchema.extend({ kind: z.enum(contributorKinds).default('person') });
export type ContributorCreate = z.infer<typeof contributorCreateSchema>;

export const contributorUpdateSchema = contributorSaveSchema
  .partial()
  .refine((m) => Object.keys(m).length > 0, { message: 'nothing to change' });
export type ContributorUpdate = z.infer<typeof contributorUpdateSchema>;

/** A byline on a published news item: the public profile with the picture and the accounts a reader may follow. */
export const publicContributorSchema = contributorSchema.extend({
  image: publicMediaSchema.nullable(),
  socialLinks: z.array(z.object({ network: z.enum(socialNetworks), url: z.string() })),
});
export type PublicContributor = z.infer<typeof publicContributorSchema>;
