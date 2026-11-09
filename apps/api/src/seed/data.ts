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
/**
 * Regions: the places a news item is about. They are not menu sections (the web's region list, in order).
 * The address of a region is its key in both languages.
 */
export const regions = [
  { key: 'americas', en: 'Americas', bn: 'আমেরিকা' },
  { key: 'europe', en: 'Europe', bn: 'ইউরোপ' },
  { key: 'russia', en: 'Russia', bn: 'রাশিয়া' },
  { key: 'middle-east', en: 'Middle East', bn: 'মধ্যপ্রাচ্য' },
  { key: 'south-asia', en: 'South Asia', bn: 'দক্ষিণ এশিয়া' },
  { key: 'china', en: 'China', bn: 'চীন' },
  { key: 'asia', en: 'Asia', bn: 'এশিয়া' },
  { key: 'oceania', en: 'Oceania', bn: 'ওশেনিয়া' },
] as const;

/**
 * The news menu, exactly as the public site shows it, in its order (Geopolitics, Economy, Security, Technology,
 * History). The key is the address in both languages (/category/<key>). Regions and the analysis hub are not
 * menu sections. Names are the site's own labels; there is no description until the editors write one.
 */
export const categories = [
  { key: 'geopolitics', en: 'Geopolitics and Diplomacy', bn: 'ভূরাজনীতি ও কূটনীতি' },
  { key: 'economy', en: 'Economy and Trade', bn: 'অর্থনীতি ও বাণিজ্য' },
  { key: 'security', en: 'Security and Conflict', bn: 'নিরাপত্তা ও সংঘাত' },
  { key: 'technology', en: 'Technology and Strategic Power', bn: 'প্রযুক্তি ও কৌশলগত শক্তি' },
  { key: 'history', en: 'History and Context', bn: 'ইতিহাস ও প্রেক্ষাপট' },
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
  { key: 'rate_limit.news_view_beacon', scope: 'global', value: { limit: 60, windowSeconds: 60 } },
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
  { key: 'analytics.news_views', description: 'First-party news view beacon behind most-read and trending.' },
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
  { key: 'reporter', name: 'Reporter', capabilities: ['news.edit', 'news.submit'] },
  { key: 'desk_editor', name: 'Desk Editor', capabilities: ['news.edit', 'news.submit', 'news.review'] },
  { key: 'copy_editor', name: 'Copy Editor', capabilities: ['news.edit', 'news.review'] },
  { key: 'fact_checker', name: 'Fact Checker', capabilities: ['news.fact_check'] },
  {
    key: 'managing_editor',
    name: 'Managing Editor',
    capabilities: [
      'news.edit', 'news.submit', 'news.review', 'news.fact_check', 'news.publish', 'news.correct',
      'taxonomy.manage', 'audit.read',
    ],
  },
  { key: 'media_editor', name: 'Media Editor', capabilities: ['media.manage'] },
  { key: 'analyst', name: 'Analyst', capabilities: [] },
  {
    key: 'admin',
    name: 'Admin',
    capabilities: [
      'news.edit', 'news.submit', 'news.review', 'news.fact_check', 'news.publish', 'news.correct',
      'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage',
    ],
  },
];

/**
 * RSS feeds for the source inbox. They are seeded PAUSED: an administrator resumes the ones the
 * newsroom wants, so a fresh database never starts fetching publishers by itself. Each address was
 * fetched and parsed with the worker's own fetcher before it was listed. Reuters is left out on
 * purpose: its own feeds are gone, and the Google News stand-in links to Google redirect pages, which
 * defeats the duplicate check and the source link. RSS access is not a licence to republish: the
 * inbox keeps a short plain snippet and a link, and an editor writes the story.
 */
export const feeds: ReadonlyArray<{ name: string; url: string; pollMinutes: number }> = [
  { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', pollMinutes: 15 },
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', pollMinutes: 15 },
  { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', pollMinutes: 15 },
  { name: 'Deutsche Welle', url: 'https://rss.dw.com/rdf/rss-en-top', pollMinutes: 15 },
  { name: 'France 24', url: 'https://www.france24.com/en/rss', pollMinutes: 15 },
  { name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', pollMinutes: 15 },
  { name: 'The Guardian Middle East', url: 'https://www.theguardian.com/world/middleeast/rss', pollMinutes: 15 },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', pollMinutes: 15 },
  { name: 'The Guardian Global Development', url: 'https://www.theguardian.com/global-development/rss', pollMinutes: 15 },
];
