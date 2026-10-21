import type { FeatureFlagKey } from '@fact-lens/contracts';

/**
 * Reference data inserted by `pnpm seed`. Safe to re-run: existing rows are never overwritten,
 * so edits made through the newsroom Configuration screen survive.
 */

/**
 * PROVISIONAL. Which desks exist at launch is an open product decision (docs/19, question 1).
 * These four mirror the desk bylines already used on cipher-press so imports have a target.
 */
export const desks = [
  { key: 'jessore-news', name: 'Jessore News Desk' },
  { key: 'opinion', name: 'Opinion Desk' },
  { key: 'data-research', name: 'Data & Research Desk' },
  { key: 'health-science', name: 'Health & Science Desk' },
] as const;

/**
 * Navigation categories carried over from cipher-press (apps/data/json/category.*.json).
 * Slugs are clean keys; cipher-press used locale-prefixed slugs such as `en-local`, so the
 * legacy URL map still has to be built (docs/19, question 14).
 */
export const categories = [
  { key: 'local', en: 'Local', bn: 'স্থানীয়' },
  { key: 'national', en: 'National', bn: 'জাতীয়' },
  { key: 'politics', en: 'Politics', bn: 'রাজনীতি' },
  { key: 'economy', en: 'Economy', bn: 'অর্থনীতি' },
  { key: 'business', en: 'Business', bn: 'ব্যবসা' },
  { key: 'international', en: 'International', bn: 'আন্তর্জাতিক' },
  { key: 'sports', en: 'Sports', bn: 'খেলা' },
  { key: 'technology', en: 'Technology', bn: 'প্রযুক্তি' },
  { key: 'health', en: 'Health', bn: 'স্বাস্থ্য' },
] as const;

/**
 * Starting values, all editable at runtime. The numbers are conservative placeholders to be
 * tuned from real traffic. AI budgets start at 0, which keeps AI off until an operator sets one.
 * No retention rules are seeded: those policies are undecided (docs/19, questions 4, 9 and 10).
 */
export const configuration: ReadonlyArray<{ key: string; scope: string; value: unknown }> = [
  {
    key: 'workflow.transition_policy',
    scope: 'global',
    value: {
      factCheckRequired: false,
      requiredCapability: {
        editor_review: 'story.submit',
        fact_check: 'story.review',
        ready: 'story.fact_check',
        publish: 'story.publish',
        correct: 'story.correct',
        archive: 'story.publish',
      },
    },
  },
  { key: 'rate_limit.login', scope: 'global', value: { limit: 10, windowSeconds: 300 } },
  { key: 'rate_limit.search', scope: 'global', value: { limit: 60, windowSeconds: 60 } },
  { key: 'rate_limit.ingestion', scope: 'global', value: { limit: 120, windowSeconds: 60 } },
  { key: 'rate_limit.upload', scope: 'global', value: { limit: 30, windowSeconds: 60 } },
  { key: 'rate_limit.ad_redirect', scope: 'global', value: { limit: 30, windowSeconds: 60 } },
  { key: 'rate_limit.story_view_beacon', scope: 'global', value: { limit: 60, windowSeconds: 60 } },
  { key: 'rate_limit.newsletter_subscribe', scope: 'global', value: { limit: 5, windowSeconds: 3600 } },
  { key: 'rate_limit.card_generation', scope: 'global', value: { limit: 20, windowSeconds: 60 } },
  { key: 'rate_limit.ai', scope: 'global', value: { limit: 20, windowSeconds: 60 } },
  ...(
    ['headline_suggestions', 'translation', 'summary', 'rewrite', 'taxonomy_suggestions', 'alt_text_captions'] as const
  ).map((useCase) => ({
    key: `ai.use_case.${useCase}`,
    scope: 'global',
    value: { provider: 'gemini', model: null, monthlyBudgetUsd: 0 },
  })),
];

/** Every flag starts off. Turn a module on per environment once its review is done (docs/21). */
export const featureFlags: ReadonlyArray<{ key: FeatureFlagKey; description: string }> = [
  { key: 'ai.assist', description: 'AI Gateway proposals: headlines, summaries, translation, taxonomy, alt text.' },
  { key: 'ai.rewrite', description: 'AI rewrite of ingested source articles. Copyright exposure: needs the transformation policy first.' },
  { key: 'ingestion.rss', description: 'RSS and partner API source polling.' },
  { key: 'ingestion.telegram', description: 'Telegram channel ingestion through the Bot API. Depends on Telegram terms of service.' },
  { key: 'ads.serving', description: 'Serve ads on the public site.' },
  { key: 'ads.redirect', description: 'Signed ad click-redirect endpoint. Open-redirect and abuse surface.' },
  { key: 'newsletter.subscribe', description: 'Public newsletter subscription with double opt-in.' },
  { key: 'analytics.story_views', description: 'First-party story view beacon behind most-read and trending.' },
  { key: 'analytics.ga4', description: 'Google Analytics 4 tag. Gated by reader consent.' },
  { key: 'cards.generation', description: 'Branded photocard and poster generation worker.' },
  { key: 'distribution.facebook', description: 'Publish generated cards to the FactLens Facebook Page.' },
];
