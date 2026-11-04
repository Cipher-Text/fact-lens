// Which stories go into which homepage section (spacing-layout-system.md 7.1).
// "full" fills every section. "sparse" has one sparse case per pattern (7.3).
import {
  regionIds,
  type CategoryId,
  type HomepageVariant,
  type RegionId,
} from "./types";

export interface HomepagePlan {
  hero: { lead: string; top: string[]; latest: string[] } | null;
  analysisOpinion: { analysis: string[]; opinion: string[] } | null;
  featured: {
    /** P-2 South Asia: stories with the region south-asia (DR-412). */
    southAsia: { lead: string; rail: string[] } | null;
    geopolitics: { lead: string; rail: string[] } | null;
  };
  grouped: { category: CategoryId; stories: string[] }[];
  mostRead: string[];
  /** Region order. Each region's stories come from the story data. */
  regions: RegionId[];
}

// চীন is a region, not a category (DR-19). Russia and Oceania have no stories, so they
// do not show.
const allRegions: RegionId[] = [...regionIds];

export const homepagePlans: Record<HomepageVariant, HomepagePlan> = {
  full: {
    hero: {
      lead: "river-data-framework",
      // Two top-story cards (DR-44). Each has an image (DR-91).
      top: ["deep-sea-port-trial-ship", "border-crossing-digital-pass"],
      latest: [
        "exports-september",
        "foreign-secretary-kathmandu",
        "new-submarine-cable",
        "transit-facility-expansion",
        "coast-guard-patrol-boats",
        "liberation-war-press-archive",
      ],
    },
    analysisOpinion: {
      analysis: [
        "small-state-balancing",
        "reserve-indicators",
        "bay-security-calculation",
      ],
      opinion: [
        "opinion-connectivity-not-port",
        "opinion-climate-finance",
        "opinion-digital-economy-youth",
        "opinion-regional-history",
        "opinion-energy-transition-labour",
      ],
    },
    featured: {
      southAsia: {
        lead: "cross-border-water-project",
        // Three text stories in the rail (IMP-125, DR-451).
        rail: [
          "regional-maritime-patrol-accord",
          "regional-economic-integration-prospects",
          "maritime-boundary-agreement",
        ],
      },
      geopolitics: {
        lead: "bay-trilateral-dialogue",
        rail: [
          "regional-power-grid",
          "peacekeeping-women-target",
          "visa-joint-committee",
        ],
      },
    },
    grouped: [
      {
        category: "security",
        stories: [
          "cyber-response-centre",
          "fishing-boat-trackers",
          "hill-road-security-posts",
        ],
      },
      {
        category: "history",
        stories: [
          "old-dhaka-trade-ledgers",
          "southern-silk-route",
          "partition-oral-history",
        ],
      },
      {
        category: "economy",
        stories: [
          "garment-latin-america",
          "inflation-third-month",
          "remittance-digital-channel",
        ],
      },
      {
        category: "technology",
        stories: [
          "farm-drone-tests",
          "ai-policy-draft",
          "char-satellite-internet",
        ],
      },
    ],
    // Top 5 (DR-51).
    mostRead: [
      "deep-sea-port-trial-ship",
      "cross-border-water-project",
      "reserve-indicators",
      "inflation-third-month",
      "regional-security-pact",
    ],
    regions: allRegions,
  },

  sparse: {
    hero: {
      // A lead with no image, one top story, and a short Latest list.
      lead: "joint-border-patrol-rules",
      top: ["deep-sea-port-trial-ship"],
      latest: ["exports-september", "foreign-secretary-kathmandu"],
    },
    // The opinion column is empty, so analysis spans the shell.
    analysisOpinion: {
      analysis: ["small-state-balancing", "reserve-indicators"],
      opinion: [],
    },
    featured: {
      // No rail stories: the wrapper spans the shell.
      southAsia: { lead: "cross-border-water-project", rail: [] },
      // No content: the section and its ad row do not show.
      geopolitics: null,
    },
    // An odd number of categories: the last keeps its size.
    grouped: [
      {
        category: "security",
        stories: [
          "cyber-response-centre",
          "fishing-boat-trackers",
          "hill-road-security-posts",
        ],
      },
      {
        category: "history",
        stories: [
          "old-dhaka-trade-ledgers",
          "southern-silk-route",
          "partition-oral-history",
        ],
      },
      {
        category: "economy",
        stories: ["garment-latin-america", "inflation-third-month"],
      },
    ],
    mostRead: [
      "deep-sea-port-trial-ship",
      "cross-border-water-project",
      "reserve-indicators",
    ],
    // 3 regions after the empty one is removed: all fit in view from 1024px, so no buttons there.
    regions: ["middle-east", "china", "asia", "oceania"],
  },
};
