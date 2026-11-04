// The only way components read content (DR-01). A backend can replace the
// data behind these functions later without changes to components.
import { ads } from "./ads";
import { categoryMostRead } from "./category-most-read";
import { homepagePlans } from "./homepage";
import { dailyPoll } from "./poll";
import { authors, imageFiles, stories, type StoryDef } from "./stories";
import { topics, type TopicId } from "./topics";
import { trendingTerms } from "./trending";
import type {
  Ad,
  AdSlotId,
  AnalysisPage,
  CategoryId,
  CategoryPage,
  FeaturedSection,
  FeaturedSource,
  Homepage,
  HomepageVariant,
  Lang,
  LatestPage,
  Poll,
  RegionId,
  Story,
  TopicPage,
} from "./types";

export type * from "./types";
export { categoryIds, regionIds } from "./types";
export { currentStoryRef, storyRef } from "./urls";

// The article page (wild card reader): its content goes through this file too (DR-01).
export {
  articleLangsOf,
  articleRefs,
  getArticle,
  getArticleByRef,
  getReadNext,
  imageFiles,
  type Article,
  type ArticleContext,
  type Block,
  type ReadNextItem,
  type ReaderAuthor,
} from "./reader";

// The mock plans name stories by slug; the article URL finds a story by id (layout 7C).
const bySlug = new Map(stories.map((def) => [def.slug, def]));

function toStory(def: StoryDef, lang: Lang): Story {
  const text = def[lang];
  const story: Story = {
    id: def.id,
    lang,
    slug: def.slug,
    format: def.format,
    category: def.category,
    regions: def.regions,
    title: text.title,
    publishedAt: def.publishedAt,
  };
  if (text.summary) story.summary = text.summary;
  if (def.readingMinutes) story.readingMinutes = def.readingMinutes;
  if (def.author)
    story.author = { name: authors[def.author][lang], slug: def.author };
  if (def.image) {
    story.image = { ...imageFiles[def.image], alt: text.imageAlt ?? "" };
  }
  return story;
}

/** One story in one language. Throws for an unknown slug, so a typo in the plan fails fast. */
export function getStory(slug: string, lang: Lang): Story {
  const def = bySlug.get(slug);
  if (!def) throw new Error(`Unknown story slug: ${slug}`);
  return toStory(def, lang);
}

function getStories(slugs: string[], lang: Lang): Story[] {
  return slugs.map((slug) => getStory(slug, lang));
}

/** Newest first. */
function newestFirst(a: Story, b: Story): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

function getRegionStories(region: RegionId, lang: Lang): Story[] {
  return stories
    .filter((def) => def.regions.includes(region))
    .map((def) => toStory(def, lang))
    .sort(newestFirst);
}

export function getPoll(lang: Lang): Poll {
  const text = dailyPoll[lang];
  return {
    id: dailyPoll.id,
    lang,
    question: text.question,
    options: (Object.keys(text.options) as (keyof typeof text.options)[]).map(
      (id) => ({
        id,
        label: text.options[id],
        votes: dailyPoll.votes[id],
      }),
    ),
  };
}

/** The mock booking for one ad slot, in the page language. */
export function getAd(slot: AdSlotId, lang: Lang): Ad {
  const def = ads.find((ad) => ad.slot === slot);
  if (!def) throw new Error(`No mock ad for slot: ${slot}`);
  const advertiser = def.advertiser[lang];
  return {
    slot,
    advertiser,
    alt: advertiser,
    link: def.link,
    startsOn: def.startsOn,
    endsOn: def.endsOn,
    creatives: def.creatives.map(({ size, width, height }) => ({
      src: `/mock/ad-${size}.svg`,
      width,
      height,
    })),
  };
}

function nonEmpty<T>(items: T[]): T[] | null {
  return items.length > 0 ? items : null;
}

/**
 * The homepage in one language. Applies the content rules of
 * spacing-layout-system.md 7.3: a region with no stories is removed, and a
 * section with no content is null (the page drops it and its ad row).
 */
export function getHomepage(
  lang: Lang,
  { variant = "full" }: { variant?: HomepageVariant } = {},
): Homepage {
  const plan = homepagePlans[variant];

  const featured = (
    section: { feature: string; rail: string[] } | null,
    source: FeaturedSource,
  ): FeaturedSection | null =>
    section && {
      source,
      feature: getStory(section.feature, lang),
      rail: getStories(section.rail, lang),
    };

  const analysisOpinion = plan.analysisOpinion && {
    analysis: getStories(plan.analysisOpinion.analysis, lang),
    opinion: getStories(plan.analysisOpinion.opinion, lang),
  };

  const groupedCategories = plan.grouped
    .map(({ category, stories: ids }) => ({
      category,
      stories: getStories(ids, lang),
    }))
    .filter((block) => block.stories.length > 0);

  const regions = plan.regions
    .map((region) => ({ region, stories: getRegionStories(region, lang) }))
    .filter((block) => block.stories.length > 0);

  return {
    lang,
    hero: plan.hero && {
      lead: getStory(plan.hero.lead, lang),
      top: getStories(plan.hero.top, lang),
      latest: getStories(plan.hero.latest, lang),
    },
    analysisOpinion:
      analysisOpinion &&
      analysisOpinion.analysis.length + analysisOpinion.opinion.length > 0
        ? analysisOpinion
        : null,
    featured: {
      southAsia: featured(plan.featured.southAsia, {
        kind: "region",
        id: "south-asia",
      }),
      geopolitics: featured(plan.featured.geopolitics, {
        kind: "category",
        id: "geopolitics",
      }),
    },
    grouped:
      groupedCategories.length > 0
        ? { categories: groupedCategories, poll: getPoll(lang) }
        : null,
    mostRead: nonEmpty(
      getStories(plan.mostRead, lang).map((story, index) => ({
        ...story,
        rank: index + 1,
      })),
    ),
    regions: nonEmpty(regions),
  };
}

const LATEST_COUNT = 5;
const CARD_COUNT = 3;
// At most 5 stories per block of the analysis and opinion row (tajmin, 28 Oct 2026).
const FORMAT_BLOCK_COUNT = 5;
// The top 5, as on the homepage (tajmin, checkpoint 4).
const MOST_READ_COUNT = 5;

/**
 * A category page in one language (spacing-layout-system.md 7B, DR-415). Stories are newest
 * first. The main stream is news only: the cover story is the newest news story with an
 * image, the rail takes the next 5, the card rows the next 3 with an image. The analysis and
 * opinion row takes up to 5 of each. More stories is the news and analysis not shown above,
 * never opinion. Opinion past the 5th is not on the category page: it belongs to the
 * /opinion hub (DR-415). Most read comes from the mock ranking.
 */
export function getCategoryPage(
  category: CategoryId,
  lang: Lang,
): CategoryPage {
  const all = stories
    .filter((def) => def.category === category)
    .map((def) => toStory(def, lang))
    .sort(newestFirst);
  const news = all.filter((story) => story.format === "news");
  const cover = news.find((story) => story.image) ?? null;
  const rest = news.filter((story) => story !== cover);
  const latest = rest.slice(0, LATEST_COUNT);
  const cards = rest
    .slice(LATEST_COUNT)
    .filter((story) => story.image)
    .slice(0, CARD_COUNT);
  const analysis = all
    .filter((story) => story.format === "analysis")
    .slice(0, FORMAT_BLOCK_COUNT);
  const opinion = all
    .filter((story) => story.format === "opinion")
    .slice(0, FORMAT_BLOCK_COUNT);
  const shown = new Set([cover, ...latest, ...cards, ...analysis]);
  const more = all.filter(
    (story) => story.format !== "opinion" && !shown.has(story),
  );
  return {
    lang,
    category,
    cover,
    latest,
    cards,
    analysis,
    opinion,
    mostRead: getStories(
      categoryMostRead[category].slice(0, MOST_READ_COUNT),
      lang,
    ).map((story, index) => ({ ...story, rank: index + 1 })),
    more,
  };
}

/**
 * The Latest page in one language (layout 7C.2 Paths, News hub row: news only). Every news story of every
 * category, newest first. Every story has a category, so no region-only news shows
 * (tajmin, 28 Oct 2026).
 */
export function getLatestPage(lang: Lang): LatestPage {
  return {
    lang,
    stories: stories
      .filter((def) => def.format === "news")
      .map((def) => toStory(def, lang))
      .sort(newestFirst),
  };
}

/**
 * The analysis hub in one language (layout 7C.2 Paths, Analysis hub row). Every analysis
 * story, newest first: the newest is the cover, the next 4 the top, the rest More stories.
 * The newest stands in until the editor picks are decided (tajmin, 2 Nov 2026).
 */
export function getAnalysisPage(lang: Lang): AnalysisPage {
  const all = stories
    .filter((def) => def.format === "analysis")
    .map((def) => toStory(def, lang))
    .sort(newestFirst);
  return {
    lang,
    cover: all[0] ?? null,
    top: all.slice(1, 5),
    more: all.slice(5),
  };
}

/** Every topic slug, for the static topic pages (layout 7C.2 Paths, Topic row). */
export function getTopicSlugs(): string[] {
  return Object.values(topics).map((topic) => topic.slug);
}

/** The topic page, or undefined for an unknown slug (a 404 page). */
export function getTopicPage(lang: Lang, slug: string): TopicPage | undefined {
  const entry = Object.entries(topics).find(([, topic]) => topic.slug === slug);
  if (!entry) return undefined;
  const id = entry[0] as TopicId;
  return {
    lang,
    topic: { id, slug, label: entry[1][lang] },
    stories: stories
      .filter((def) => def.format !== "opinion" && def.topics?.includes(id))
      .map((def) => toStory(def, lang))
      .sort(newestFirst),
  };
}

/** The trending search terms for the SearchDialog, in the page language (mock). */
export function getTrendingTerms(lang: Lang): string[] {
  return trendingTerms[lang];
}
