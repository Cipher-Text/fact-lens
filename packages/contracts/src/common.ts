import { z } from 'zod';

export const idSchema = z.uuid();
export const timestampSchema = z.iso.datetime({ offset: true });
export const localeCodeSchema = z.string().min(2).max(16);
export const httpUrlSchema = z.url({ protocol: /^https?$/ });
export const slugSchema = z.string().min(1).max(200).regex(/^[\p{L}\p{N}][\p{L}\p{N}-]*$/u, 'letters, digits and hyphens');

export const localeSchema = z.object({
  code: localeCodeSchema,
  displayName: z.string(),
  direction: z.enum(['ltr', 'rtl']),
  active: z.boolean(),
});
export type Locale = z.infer<typeof localeSchema>;
