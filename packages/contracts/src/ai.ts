import { z } from 'zod';
import { idSchema, localeCodeSchema } from './common';

/** Ask for a headline, standfirst, slug and search text for one language of a news item, from its text. */
export const aiSuggestRequestSchema = z.object({
  locale: localeCodeSchema,
  /** The news text as plain text. Sent to the AI service, so it is capped. */
  text: z.string().trim().min(40, 'write the text first: at least 40 characters').max(20000),
});
export type AiSuggestRequest = z.infer<typeof aiSuggestRequestSchema>;

/** Limits match the translation fields they fill. */
export const aiSuggestionSchema = z.object({
  title: z.string().max(300),
  dek: z.string().max(600),
  /** Lowercase Latin letters, digits and hyphens, so one slug can serve every language of the item. */
  slug: z.string().min(1).max(200),
  seoTitle: z.string().max(120),
  seoDescription: z.string().max(320),
  /** Existing tags that fit the text, chosen from the active tags named in this language. Never new ones. */
  tags: z.array(z.object({ id: idSchema, key: z.string(), name: z.string() })).max(10),
});
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;

/**
 * Translate one language of a news item into another. The body is sent as its text pieces, in order,
 * so the editor keeps the structure (headings, bold, links, images) and only the words change.
 */
export const aiTranslateRequestSchema = z.object({
  fromLocale: localeCodeSchema,
  toLocale: localeCodeSchema,
  title: z.string().trim().min(1).max(300),
  dek: z.string().max(600).default(''),
  seoTitle: z.string().max(120).default(''),
  seoDescription: z.string().max(320).default(''),
  segments: z.array(z.string().max(5000)).max(2000),
}).refine((r) => r.fromLocale !== r.toLocale, 'choose two different languages')
  .refine((r) => r.segments.reduce((n, s) => n + s.length, 0) <= 40000, 'the text is too long to translate in one go');
export type AiTranslateRequest = z.infer<typeof aiTranslateRequestSchema>;

export const aiTranslationSchema = z.object({
  title: z.string(), dek: z.string(), seoTitle: z.string(), seoDescription: z.string(), segments: z.array(z.string()),
});
export type AiTranslation = z.infer<typeof aiTranslationSchema>;
