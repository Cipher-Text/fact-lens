import { z } from 'zod';

/** Capabilities gate actions; roles are only named sets of them (docs/06, docs/12). */
export const capabilities = [
  'story.edit', 'story.submit', 'story.review', 'story.fact_check', 'story.publish',
  'story.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage',
] as const;
export const capabilitySchema = z.enum(capabilities);
export type Capability = z.infer<typeof capabilitySchema>;

/** Capabilities that need a multi-factor sign-in when the deployment requires MFA. */
export const privilegedCapabilities = [
  'story.publish', 'story.correct', 'audit.read', 'ads.manage', 'config.manage',
] as const satisfies readonly Capability[];

export const principalSchema = z.object({
  subject: z.string().min(1),
  roles: z.array(z.string()),
  capabilities: z.array(capabilitySchema),
  mfa: z.boolean(),
});
export type Principal = z.infer<typeof principalSchema>;

export const featureFlagUpdateSchema = z.object({
  enabled: z.boolean(),
  /** Required: every runtime change is audited with its reason (docs/12). */
  reason: z.string().trim().min(3).max(500),
});
export type FeatureFlagUpdate = z.infer<typeof featureFlagUpdateSchema>;

/** Holding any of these lets a caller read drafts in the newsroom. */
export const editorialCapabilities = [
  'story.edit', 'story.submit', 'story.review', 'story.fact_check', 'story.publish', 'story.correct',
] as const satisfies readonly Capability[];
