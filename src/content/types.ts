// Mock content types (DR-01). A backend can replace the data behind
// getHomepage() later without changes to components.
import type { Lang } from "@/i18n/config";

export type { Lang };

export type Format = "news" | "analysis" | "opinion" | "explainer";

// চীন is a region, not a category (DR-19). No fact-check category (DR-18).
export type CategoryId =
  | "bangladesh"
  | "geopolitics"
  | "security"
  | "history"
  | "economy"
  | "technology";

export type RegionId =
  | "china"
  | "india"
  | "myanmar"
  | "middle-east"
  | "southeast-asia"
  | "europe"
  | "africa";

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
  region?: RegionId;
  title: string;
  summary?: string;
  author?: { name: string; slug: string };
  publishedAt: string; // ISO 8601
  readingMinutes?: number; // card metadata: time, then reading time
  image?: ImageRef; // some stories have no image
  breaking?: boolean;
}

/** P-1: lead, one or two top stories (DR-44), and the Latest rail. */
export interface HeroSection {
  lead: Story;
  top: Story[];
  latest: Story[];
}

/** P-2: lead in the wrapper, one image story and two stories in the rail. */
export interface FeaturedSection {
  category: CategoryId;
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
  hero: HeroSection | null;
  analysisOpinion: AnalysisOpinionSection | null;
  featured: {
    bangladesh: FeaturedSection | null;
    geopolitics: FeaturedSection | null;
  };
  grouped: { categories: CategoryBlock[]; poll: Poll } | null;
  mostRead: Story[] | null;
  regions: RegionBlock[] | null;
}

export type HomepageVariant = "full" | "sparse";

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
