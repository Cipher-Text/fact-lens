import { defaultWorkflowPolicy, type Capability, type FeatureFlagKey } from '@fact-lens/contracts';

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
  { key: 'local', en: 'Local', bn: 'স্থানীয়', enDescription: "Local news from Jessore and other districts covering administration, community affairs and public life.", bnDescription: "যশোরসহ বিভিন্ন জেলার স্থানীয় খবর, প্রশাসন, জনজীবন ও সামাজিক ঘটনা।" },
  { key: 'national', en: 'National', bn: 'জাতীয়', enDescription: "Major national news of Bangladesh including government, administration and public affairs.", bnDescription: "বাংলাদেশের জাতীয় গুরুত্বপূর্ণ খবর—সরকার, প্রশাসন ও জনজীবনের আপডেট।" },
  { key: 'politics', en: 'Politics', bn: 'রাজনীতি', enDescription: "Political developments, elections, parliament updates and policy debates.", bnDescription: "নির্বাচন, সংসদ, রাজনৈতিক দল ও নীতিগত সিদ্ধান্তের খবর।" },
  { key: 'economy', en: 'Economy', bn: 'অর্থনীতি', enDescription: "Economic trends including inflation, trade, remittance and fiscal policy.", bnDescription: "বাংলাদেশের অর্থনীতি, বাজেট, মূল্যস্ফীতি ও বাজার বিশ্লেষণ।" },
  { key: 'business', en: 'Business', bn: 'ব্যবসা', enDescription: "Corporate news, startups, investments, industries and trade.", bnDescription: "কোম্পানি, বিনিয়োগ, শিল্প ও বাণিজ্য সংক্রান্ত খবর।" },
  { key: 'international', en: 'International', bn: 'আন্তর্জাতিক', enDescription: "Global politics, diplomacy and world events relevant to Bangladesh.", bnDescription: "বিশ্ব রাজনীতি, কূটনীতি ও আন্তর্জাতিক গুরুত্বপূর্ণ ঘটনা।" },
  { key: 'sports', en: 'Sports', bn: 'খেলা', enDescription: "Cricket, football, tournaments, match reports and athlete updates.", bnDescription: "ক্রিকেট, ফুটবলসহ জাতীয় ও আন্তর্জাতিক ক্রীড়া সংবাদ।" },
  { key: 'technology', en: 'Technology', bn: 'প্রযুক্তি', enDescription: "AI, software, gadgets, startups and cybersecurity.", bnDescription: "এআই, সফটওয়্যার, গ্যাজেট ও ডিজিটাল নিরাপত্তা।" },
  { key: 'health', en: 'Health', bn: 'স্বাস্থ্য', enDescription: "Public health, hospitals, medical research and healthcare awareness.", bnDescription: "জনস্বাস্থ্য, চিকিৎসা, হাসপাতাল ও স্বাস্থ্য সচেতনতা।" },
] as const;

/**
 * Starting values, all editable at runtime. The numbers are conservative placeholders to be
 * tuned from real traffic. AI budgets start at 0, which keeps AI off until an operator sets one.
 * No retention rules are seeded: those policies are undecided (docs/19, questions 4, 9 and 10).
 */
export const configuration: ReadonlyArray<{ key: string; scope: string; value: unknown }> = [
  { key: 'workflow.transition_policy', scope: 'global', value: defaultWorkflowPolicy },
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

/**
 * PROVISIONAL role definitions (docs/06 names the roles; who may approve what is open question 1).
 * Authorization checks capabilities, so changing a role is a data edit, not a deploy.
 * `analyst` has no capability yet: the plan defines no analytics capability.
 */
export const roles: ReadonlyArray<{ key: string; name: string; capabilities: readonly Capability[] }> = [
  { key: 'reporter', name: 'Reporter', capabilities: ['story.edit', 'story.submit'] },
  { key: 'desk_editor', name: 'Desk Editor', capabilities: ['story.edit', 'story.submit', 'story.review'] },
  { key: 'copy_editor', name: 'Copy Editor', capabilities: ['story.edit', 'story.review'] },
  { key: 'fact_checker', name: 'Fact Checker', capabilities: ['story.fact_check'] },
  {
    key: 'managing_editor',
    name: 'Managing Editor',
    capabilities: [
      'story.edit', 'story.submit', 'story.review', 'story.fact_check', 'story.publish', 'story.correct',
      'taxonomy.manage', 'audit.read',
    ],
  },
  { key: 'media_editor', name: 'Media Editor', capabilities: ['media.manage'] },
  { key: 'analyst', name: 'Analyst', capabilities: [] },
  {
    key: 'admin',
    name: 'Admin',
    capabilities: [
      'story.edit', 'story.submit', 'story.review', 'story.fact_check', 'story.publish', 'story.correct',
      'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage',
    ],
  },
];
