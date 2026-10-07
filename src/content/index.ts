// The only way components read content (DR-01). A backend can replace the
// data behind these functions later without changes to components.
import { homepagePlans } from "./homepage";
import { dailyPoll } from "./poll";
import { authors, imageFiles, stories, type StoryDef } from "./stories";
import type {
  FeaturedSection,
  Homepage,
  HomepageVariant,
  Lang,
  Poll,
  RegionId,
  Story,
} from "./types";

export type * from "./types";

const byId = new Map(stories.map((def) => [def.id, def]));

function toStory(def: StoryDef, lang: Lang): Story {
  const text = def[lang];
  const story: Story = {
    id: def.id,
    lang,
    slug: def.id,
    format: def.format,
    category: def.category,
    title: text.title,
    publishedAt: def.publishedAt,
  };
  if (def.region) story.region = def.region;
  if (text.summary) story.summary = text.summary;
  if (def.readingMinutes) story.readingMinutes = def.readingMinutes;
  if (def.breaking) story.breaking = true;
  if (def.author)
    story.author = { name: authors[def.author][lang], slug: def.author };
  if (def.image) {
    story.image = { ...imageFiles[def.image], alt: text.imageAlt ?? "" };
  }
  return story;
}

/** One story in one language. Throws for an unknown id, so a typo in the plan fails fast. */
export function getStory(id: string, lang: Lang): Story {
  const def = byId.get(id);
  if (!def) throw new Error(`Unknown story id: ${id}`);
  return toStory(def, lang);
}

function getStories(ids: string[], lang: Lang): Story[] {
  return ids.map((id) => getStory(id, lang));
}

/** Newest first. */
function newestFirst(a: Story, b: Story): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

export function getRegionStories(region: RegionId, lang: Lang): Story[] {
  return stories
    .filter((def) => def.region === region)
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
    section: { lead: string; rail: string[] } | null,
    category: FeaturedSection["category"],
  ): FeaturedSection | null =>
    section && {
      category,
      lead: getStory(section.lead, lang),
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
      bangladesh: featured(plan.featured.bangladesh, "bangladesh"),
      geopolitics: featured(plan.featured.geopolitics, "geopolitics"),
    },
    grouped:
      groupedCategories.length > 0
        ? { categories: groupedCategories, poll: getPoll(lang) }
        : null,
    mostRead: nonEmpty(getStories(plan.mostRead, lang)),
    regions: nonEmpty(regions),
  };
}
