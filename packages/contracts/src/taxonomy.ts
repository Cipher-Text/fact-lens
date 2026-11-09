import { z } from 'zod';
import { idSchema, localeCodeSchema, shortIdSchema, slugSchema, timestampSchema } from './common';
import { publicMediaSchema } from './media';
import { localeDirections, newsFormats, taxonomyStatuses } from './enums';

/**
 * Categories (the news menu) and tags (many per news), in any number of languages. A category or
 * tag is one record with a label per language; the languages are the `locale` list, never a fixed
 * set in code. An item with no label in a language is simply absent from that language's pages.
 */

export const taxonomyKeySchema = z.string().min(1).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase letters, digits and single hyphens');

export const labelInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  /** Made from the name when left out. Unique among the same kind of item in that language. */
  slug: slugSchema.optional(),
  description: z.string().trim().max(500).nullish(),
  aliases: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
});
export type LabelInput = z.infer<typeof labelInputSchema>;

/** Labels by language code. Keys must be known languages; the API checks that against the list. */
const labelsByLocale = z.record(localeCodeSchema, labelInputSchema);

export const taxonomyLabelSchema = z.object({
  locale: localeCodeSchema,
  name: z.string(),
  slug: slugSchema,
  description: z.string().nullable(),
  aliases: z.array(z.string()),
});

export const categoryCreateSchema = z.object({
  /** Language-free identifier. Made from the first label's slug when left out. */
  key: taxonomyKeySchema.optional(),
  showInMenu: z.boolean().default(true),
  /** Makes this a child menu of another category. One level only: a child cannot have children. */
  parentId: idSchema.nullable().optional(),
  labels: labelsByLocale.refine((l) => Object.keys(l).length > 0, 'give the name in at least one language'),
});
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;

/** Only what is sent changes. A language set to null loses its label. */
export const categoryUpdateSchema = z
  .object({
    showInMenu: z.boolean(),
    /** null makes it a top-level menu again. */
    parentId: idSchema.nullable(),
    status: z.enum(taxonomyStatuses),
    labels: z.record(localeCodeSchema, labelInputSchema.nullable()),
  })
  .partial()
  .strict()
  .refine((u) => Object.keys(u).length > 0, 'nothing to change');
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

export const categoryOrderSchema = z.object({
  ids: z.array(idSchema).min(1).max(200).refine((ids) => new Set(ids).size === ids.length, 'each category once'),
});
export type CategoryOrder = z.infer<typeof categoryOrderSchema>;

export const tagCreateSchema = z.object({
  key: taxonomyKeySchema.optional(),
  /** A picture from the media library. Shown on the tag's page only when its rights allow the web. */
  imageId: idSchema.nullable().optional(),
  labels: labelsByLocale.refine((l) => Object.keys(l).length > 0, 'give the name in at least one language'),
});
export type TagCreate = z.infer<typeof tagCreateSchema>;

export const tagUpdateSchema = z
  .object({ status: z.enum(taxonomyStatuses), imageId: idSchema.nullable(), labels: z.record(localeCodeSchema, labelInputSchema.nullable()) })
  .partial()
  .strict()
  .refine((u) => Object.keys(u).length > 0, 'nothing to change');
export type TagUpdate = z.infer<typeof tagUpdateSchema>;

export const taxonomyCategorySchema = z.object({
  id: idSchema,
  key: z.string(),
  showInMenu: z.boolean(),
  parentId: idSchema.nullable(),
  position: z.number().int(),
  status: z.enum(taxonomyStatuses),
  /** News in this category. A category in use cannot be deleted, only archived. */
  usageCount: z.number().int().nonnegative(),
  labels: z.array(taxonomyLabelSchema),
});
export type TaxonomyCategory = z.infer<typeof taxonomyCategorySchema>;

/** A region: a place a news item is about. Its own list, not a menu section. */
export const taxonomyRegionSchema = z.object({
  id: idSchema,
  key: z.string(),
  position: z.number().int(),
  status: z.enum(taxonomyStatuses),
  /** News about this region. A region in use cannot be deleted, only archived. */
  usageCount: z.number().int().nonnegative(),
  labels: z.array(taxonomyLabelSchema),
});
export type TaxonomyRegion = z.infer<typeof taxonomyRegionSchema>;

export const regionCreateSchema = z.object({
  /** Language-free identifier, for example `south-asia`. Made from the first label's slug when left out. */
  key: taxonomyKeySchema.optional(),
  labels: labelsByLocale.refine((l) => Object.keys(l).length > 0, 'give the name in at least one language'),
});
export type RegionCreate = z.infer<typeof regionCreateSchema>;

/** Only what is sent changes. A language set to null loses its label. */
export const regionUpdateSchema = z
  .object({
    status: z.enum(taxonomyStatuses),
    labels: z.record(localeCodeSchema, labelInputSchema.nullable()),
  })
  .partial()
  .strict()
  .refine((u) => Object.keys(u).length > 0, 'nothing to change');
export type RegionUpdate = z.infer<typeof regionUpdateSchema>;

export const regionOrderSchema = z.object({
  ids: z.array(idSchema).min(1).max(200).refine((ids) => new Set(ids).size === ids.length, 'each region once'),
});
export type RegionOrder = z.infer<typeof regionOrderSchema>;

/** The regions of one news item. A news item's region set is replaced as a whole. */
export const newsRegionsSchema = z.object({
  regionIds: z.array(idSchema).max(20).refine((ids) => new Set(ids).size === ids.length, 'each region once'),
});
export type NewsRegions = z.infer<typeof newsRegionsSchema>;

export const taxonomyTagSchema = z.object({
  id: idSchema,
  key: z.string(),
  status: z.enum(taxonomyStatuses),
  usageCount: z.number().int().nonnegative(),
  imageId: idSchema.nullable(),
  labels: z.array(taxonomyLabelSchema),
});
export type TaxonomyTag = z.infer<typeof taxonomyTagSchema>;

export const taxonomyTagQuerySchema = z.object({
  query: z.string().trim().max(100).optional(),
  status: z.enum(taxonomyStatuses).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.string().max(200).optional(),
});

export const taxonomyTagListSchema = z.object({ items: z.array(taxonomyTagSchema), nextCursor: z.string().nullable() });
export type TaxonomyTagList = z.infer<typeof taxonomyTagListSchema>;

/** The tags of one news. A news item's tag set is replaced as a whole. */
export const newsTagsSchema = z.object({
  tagIds: z.array(idSchema).max(30).refine((ids) => new Set(ids).size === ids.length, 'each tag once'),
});
export type NewsTags = z.infer<typeof newsTagsSchema>;

// ---- languages

/** A language code such as `en`, `bn-BD` or `hi`. */
export const newLocaleCodeSchema = z.string().min(2).max(16).regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, 'a language code such as en, bn-BD or hi');

export const localeCreateSchema = z.object({
  code: newLocaleCodeSchema,
  displayName: z.string().trim().min(1).max(80),
  direction: z.enum(localeDirections).default('ltr'),
});
export type LocaleCreate = z.infer<typeof localeCreateSchema>;

export const localeUpdateSchema = z
  .object({ displayName: z.string().trim().min(1).max(80), direction: z.enum(localeDirections), active: z.boolean() })
  .partial()
  .strict()
  .refine((u) => Object.keys(u).length > 0, 'nothing to change');
export type LocaleUpdate = z.infer<typeof localeUpdateSchema>;

// ---- what readers get

/** A category or tag as a reader sees it, in the page's language. */
export const publicTaxonomyRefSchema = z.object({ key: z.string(), name: z.string(), slug: slugSchema });
export type PublicTaxonomyRef = z.infer<typeof publicTaxonomyRefSchema>;

/** A parent menu and its child menus, in the page's language. */
export const publicNavItemSchema = publicTaxonomyRefSchema.extend({ children: z.array(publicTaxonomyRefSchema) });
export type PublicNavItem = z.infer<typeof publicNavItemSchema>;

export const navigationSchema = z.array(publicNavItemSchema);

export const publicNewsListQuerySchema = z.object({
  category: slugSchema.optional(),
  tag: slugSchema.optional(),
  /** Only news about this region (its address in the page's language). */
  region: slugSchema.optional(),
  /** Only this format. */
  format: z.enum(newsFormats).optional(),
  /** Everything but this format (the news lists leave opinion out). */
  excludeFormat: z.enum(newsFormats).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(300).optional(),
});

export const publicNewsListItemSchema = z.object({
  id: idSchema,
  /** The address of the item is /story/<slug>-<shortId>. */
  shortId: shortIdSchema,
  format: z.enum(newsFormats),
  slug: slugSchema,
  title: z.string(),
  dek: z.string().nullable(),
  publishedAt: timestampSchema,
  category: publicTaxonomyRefSchema.nullable(),
});

export const publicNewsListSchema = z.object({
  /** The category or tag the list was filtered by, with its heading and description in this language. */
  filter: z.object({ type: z.enum(['category', 'tag', 'region']), name: z.string(), slug: slugSchema, description: z.string().nullable(), image: publicMediaSchema.nullable().default(null) }).nullable(),
  items: z.array(publicNewsListItemSchema),
  nextCursor: z.string().nullable(),
});
export type PublicNewsList = z.infer<typeof publicNewsListSchema>;

/** The public region list in one language, in order: key, name, address and a short description. */
export const publicRegionSchema = publicTaxonomyRefSchema.extend({ description: z.string().nullable() });
export type PublicRegion = z.infer<typeof publicRegionSchema>;
export const publicRegionListSchema = z.array(publicRegionSchema);
