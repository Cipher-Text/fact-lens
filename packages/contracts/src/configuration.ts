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
  'login', 'search', 'ingestion', 'upload', 'ad_redirect', 'story_view_beacon',
  'newsletter_subscribe', 'card_generation', 'ai',
] as const;

/** Picks the value schema for a configuration key, or undefined for an unknown key. */
export function configValueSchema(key: string): z.ZodType | undefined {
  if (key === 'workflow.transition_policy') return workflowPolicySchema;
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
  'newsletter.subscribe', 'analytics.story_views', 'analytics.ga4', 'cards.generation', 'distribution.facebook',
] as const;
export type FeatureFlagKey = (typeof featureFlagKeys)[number];

export const featureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  description: z.string(),
  updatedAt: timestampSchema,
});
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
