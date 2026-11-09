import { z } from 'zod';

export const idSchema = z.uuid();
export const timestampSchema = z.iso.datetime({ offset: true });
export const localeCodeSchema = z.string().min(2).max(16);
export const httpUrlSchema = z.url({ protocol: /^https?$/ });
/** The id at the end of a news address, /story/<slug>-<id>: 6 to 8 characters of 0-9a-z. The same in every language. */
export const shortIdSchema = z.string().regex(/^[0-9a-z]{6,8}$/);

export const slugSchema = z.string().min(1).max(200).regex(/^[\p{L}\p{N}][\p{L}\p{M}\p{N}-]*$/u, 'letters, digits and hyphens');

export const localeSchema = z.object({
  code: localeCodeSchema,
  displayName: z.string(),
  direction: z.enum(['ltr', 'rtl']),
  active: z.boolean(),
});
export type Locale = z.infer<typeof localeSchema>;
