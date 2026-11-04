// Mock content types (DR-01). A backend can replace the data behind
// getHomepage() later without changes to components.
import type { Lang } from "@/i18n/config";

export type { Lang };

// The three formats (DR-414). The format is in the content model, not in the URL.
export type Format = "news" | "analysis" | "opinion";

// চীন is a region, not a category (DR-19). No fact-check category (DR-18).
// Bangladesh is not a category: Fact Lens has no domestic news (DR-412).
export const categoryIds = [
  "geopolitics",
  "security",
  "history",
  "economy",
  "technology",
] as const;

export type CategoryId = (typeof categoryIds)[number];

// The working region list, in order (layout 7C, DR-411). The backend owns the list
// later; code reads it from here and works with any number of regions.
export const regionIds = [
  "americas",
  "europe",
  "russia",
  "middle-east",
  "south-asia",
  "china",
  "asia",
  "oceania",
] as const;

export type RegionId = (typeof regionIds)[number];

/** A topic in one language (DR-410). Its page is /topic/<slug>. */
export interface Topic {
  id: string;
  slug: string;
  label: string;
}

export interface ImageRef {
  src: string; // /mock/<name>.svg
  alt: string; // in the story language
  width: number;
  height: number;
}

export interface Story {
  id: string;
  lang: Lang;
  slug: string;
  format: Format;
  category: CategoryId;
  regions: RegionId[]; // what the story is about, one or more (DR-411)
  title: string;
  summary?: string;
  author?: { name: string; slug: string };
  publishedAt: string; // ISO 8601
  readingMinutes?: number; // card metadata: time, then reading time
  rank?: number; // Most read only: 1-based place from the most-read query (DR-290)
  image?: ImageRef; // some stories have no image
}

/** P-1: lead, one or two top stories (DR-44), and the Latest rail. */
export interface HeroContent {
  lead: Story;
  top: Story[];
  latest: Story[];
}

/** What a P-2 section features: a category or a region (DR-412). */
export type FeaturedSource =
  { kind: "category"; id: CategoryId } | { kind: "region"; id: RegionId };

/** P-2: lead in the wrapper, one image story and two stories in the rail. */
export interface FeaturedSection {
  source: FeaturedSource;
  lead: Story;
  rail: Story[];
}

/** P-3: one block of a grouped category. */
export interface CategoryBlock {
  category: CategoryId;
  stories: Story[];
}

/** P-4: analysis (image-led list) and opinion (quote list). */
export interface AnalysisOpinionSection {
  analysis: Story[];
  opinion: Story[];
}

export interface RegionBlock {
  region: RegionId;
  stories: Story[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number; // mock starting count
}

export interface Poll {
  id: string;
  lang: Lang;
  question: string;
  options: PollOption[]; // 2 to 4
}

/**
 * The homepage in one language, in page order (spacing-layout-system.md 7.1).
 * A section with no content is null, and the page does not show it or its
 * ad row (7.3). Regions with no stories are already removed.
 */
export interface Homepage {
  lang: Lang;
  hero: HeroContent | null;
  analysisOpinion: AnalysisOpinionSection | null;
  featured: {
    southAsia: FeaturedSection | null;
    geopolitics: FeaturedSection | null;
  };
  grouped: { categories: CategoryBlock[]; poll: Poll } | null;
  mostRead: Story[] | null;
  regions: RegionBlock[] | null;
}

export type HomepageVariant = "full" | "sparse";

/**
 * A category page in one language, in page order (spacing-layout-system.md 7B). Every
 * story is in the category. A section with no stories is empty, and the page drops it.
 */
export interface CategoryPage {
  lang: Lang;
  category: CategoryId;
  cover: Story | null; // the cover story: the newest news story with an image
  latest: Story[]; // the next 5 newest news stories, for the rail
  cards: Story[]; // 3 news stories with an image, one per row
  analysis: Story[]; // up to 5, newest first, for the analysis block (DR-415)
  opinion: Story[]; // up to 5, newest first, for the opinion block (DR-415)
  mostRead: Story[]; // ranked, rank set
  more: Story[]; // news and analysis not shown above, newest first; never opinion. 10 at a time
}

/**
 * The Latest page in one language (layout 7C.2 Paths, News hub row; layout 7D): the news hub,
 * every news story of every category, newest first. No analysis or opinion.
 */
export interface LatestPage {
  lang: Lang;
  stories: Story[]; // 10 first, then 10 per load
}

/**
 * The analysis hub in one language (layout 7C.2 Paths, Analysis hub row): analysis stories
 * only, newest first, no repeats. The lead is the newest, the top the next 4, more the rest.
 * Editor picks or the newest for the lead and the top: not decided (tajmin, 2 Nov 2026).
 */
export interface AnalysisPage {
  lang: Lang;
  lead: Story | null;
  top: Story[]; // up to 4
  more: Story[]; // 10 first, then 10 per load
}

/**
 * A topic page in one language (layout 7C.2 Paths, Topic row; DR-410): the news and analysis
 * stories of one topic, newest first. No opinion (tajmin, 29 Oct 2026).
 */
export interface TopicPage {
  lang: Lang;
  topic: Topic;
  stories: Story[]; // 10 first, then 10 per load
}

/** The four ad slots (spacing-layout-system.md 9). `ad-inline` is for article pages, later. */
export type AdSlotId = "ad-top" | "ad-band" | "ad-inset" | "ad-rail";

export interface AdCreative {
  src: string; // /mock/ad-<width>x<height>.svg
  width: number;
  height: number;
}

/** One mock booking for a slot, in the page language. */
export interface Ad {
  slot: AdSlotId;
  advertiser: string; // names the advertiser in the alt text (9.2)
  alt: string;
  link: string;
  startsOn: string;
  endsOn: string;
  creatives: AdCreative[];
}
