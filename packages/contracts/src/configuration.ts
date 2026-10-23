import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Editorial/runtime configuration (docs/21 tier 3). Each key has a value schema, so a bad
 * admin edit is rejected server-side. Retention rules are defined but have no seeded value:
 * the policies are open questions (docs/19, 4, 9 and 10).
 */

export const workflowTransitions = ['editor_review', 'fact_check', 'ready', 'publish', 'correct', 'archive'] as const;

export const workflowPolicySchema = z.object({
  factCheckRequired: z.boolean(),
  /** Capability that gates each transition (docs/06). */
  requiredCapability: z.record(z.enum(workflowTransitions), z.string().min(1)),
});
export type WorkflowPolicy = z.infer<typeof workflowPolicySchema>;

export const rateLimitSchema = z.object({
  limit: z.number().int().positive(),
  windowSeconds: z.number().int().positive(),
});
export type RateLimit = z.infer<typeof rateLimitSchema>;

export const aiUseCases = [
  'headline_suggestions', 'translation', 'summary', 'rewrite', 'taxonomy_suggestions', 'alt_text_captions',
] as const;

export const aiUseCasePolicySchema = z.object({
  provider: z.string().min(1),
  /** Model alias; null until an operator chooses one. */
  model: z.string().min(1).nullable(),
  monthlyBudgetUsd: z.number().nonnegative(),
});
export type AiUseCasePolicy = z.infer<typeof aiUseCasePolicySchema>;

export const retentionRuleSchema = z.object({ days: z.number().int().positive() });
export type RetentionRule = z.infer<typeof retentionRuleSchema>;

export const rateLimitNames = [
  'login', 'search', 'ingestion', 'upload', 'ad_redirect', 'news_view_beacon',
  'newsletter_subscribe', 'card_generation', 'ai',
] as const;

/**
 * The public site's social accounts, in the order the footer and the menu show them. A network with no
 * address keeps the site's default link. An address must be on that network's own domain, so a typing slip
 * or a bad edit cannot put a stranger's site in the footer.
 */
export const socialNetworks = ['facebook', 'youtube', 'x', 'instagram', 'linkedin'] as const;
export type SocialNetwork = (typeof socialNetworks)[number];

const socialHosts: Record<SocialNetwork, readonly string[]> = {
  facebook: ['facebook.com', 'fb.com'],
  youtube: ['youtube.com', 'youtu.be'],
  x: ['x.com', 'twitter.com'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com'],
};

const onDomain = (host: string, domains: readonly string[]) => domains.some((d) => host === d || host.endsWith(`.${d}`));

/** True when `url` is an https address on the network's own domain. */
export function isSocialUrl(network: SocialNetwork, url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password && onDomain(u.hostname.toLowerCase(), socialHosts[network]);
  } catch {
    return false;
  }
}

/** What an editor saves: an address per network, or null / left out for the default. */
export const socialLinksSchema = z
  .object(Object.fromEntries(socialNetworks.map((n) => [n, z.string().trim().max(300).nullish()])) as Record<SocialNetwork, z.ZodOptional<z.ZodNullable<z.ZodString>>>)
  .strict()
  .superRefine((links, ctx) => {
    for (const n of socialNetworks) {
      const url = links[n];
      if (url && !isSocialUrl(n, url)) ctx.addIssue({ code: 'custom', path: [n], message: `must be an https address on ${socialHosts[n][0]}` });
    }
  });
export type SocialLinks = z.infer<typeof socialLinksSchema>;

/** What the public site gets: only the networks that have an address. */
export const publicSocialLinksSchema = z.object({
  links: z.array(z.object({ network: z.enum(socialNetworks), url: z.string() })),
});
export type PublicSocialLinks = z.infer<typeof publicSocialLinksSchema>;

/** Picks the value schema for a configuration key, or undefined for an unknown key. */
export function configValueSchema(key: string): z.ZodType | undefined {
  if (key === 'workflow.transition_policy') return workflowPolicySchema;
  if (key === 'site.social_links') return socialLinksSchema;
  if (key.startsWith('rate_limit.')) return rateLimitSchema;
  if (key.startsWith('ai.use_case.')) return aiUseCasePolicySchema;
  if (key.startsWith('retention.')) return retentionRuleSchema;
  return undefined;
}

export function parseConfigValue(key: string, value: unknown): unknown {
  const schema = configValueSchema(key);
  if (!schema) throw new Error(`Unknown configuration key: ${key}`);
  return schema.parse(value);
}

export const configurationSchema = z.object({
  key: z.string(),
  scope: z.string(),
  value: z.unknown(),
  version: z.number().int().positive(),
  updatedAt: timestampSchema,
});
export type Configuration = z.infer<typeof configurationSchema>;

export const featureFlagKeys = [
  'ai.assist', 'ai.rewrite', 'ingestion.rss', 'ingestion.telegram', 'ads.serving', 'ads.redirect',
  'newsletter.subscribe', 'analytics.news_views', 'analytics.ga4', 'cards.generation', 'distribution.facebook',
] as const;
export type FeatureFlagKey = (typeof featureFlagKeys)[number];

export const featureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  description: z.string(),
  updatedAt: timestampSchema,
});
export type FeatureFlag = z.infer<typeof featureFlagSchema>;

/** Used when no `workflow.transition_policy` row exists. Matches the seeded global row. */
export const defaultWorkflowPolicy: WorkflowPolicy = {
  factCheckRequired: false,
  requiredCapability: {
    editor_review: 'news.submit',
    fact_check: 'news.review',
    ready: 'news.fact_check',
    publish: 'news.publish',
    correct: 'news.correct',
    archive: 'news.publish',
  },
};
