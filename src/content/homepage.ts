// Which stories go into which homepage section (spacing-layout-system.md 7.1).
// "full" fills every section. "sparse" has one sparse case per pattern (7.3).
import type { CategoryId, HomepageVariant, RegionId } from "./types";

export interface HomepagePlan {
  hero: { lead: string; top: string[]; latest: string[] } | null;
  analysisOpinion: { analysis: string[]; opinion: string[] } | null;
  featured: {
    bangladesh: { lead: string; rail: string[] } | null;
    geopolitics: { lead: string; rail: string[] } | null;
  };
  grouped: { category: CategoryId; stories: string[] }[];
  mostRead: string[];
  /** Region order. Each region's stories come from the story data. */
  regions: RegionId[];
}

// চীন is a region, not a category (DR-19). Africa has no stories, so it does not show.
const allRegions: RegionId[] = [
  "china",
  "india",
  "myanmar",
  "middle-east",
  "southeast-asia",
  "europe",
  "africa",
];

export const homepagePlans: Record<HomepageVariant, HomepagePlan> = {
  full: {
    hero: {
      lead: "river-data-framework",
      // Two top-story cards (DR-44). The second has no image.
      top: ["deep-sea-port-trial-ship", "joint-border-patrol-rules"],
      latest: [
        "exports-september",
        "foreign-secretary-kathmandu",
        "new-submarine-cable",
        "chattogram-rain-warning",
        "coast-guard-patrol-boats",
        "liberation-war-press-archive",
      ],
    },
    analysisOpinion: {
      analysis: [
        "small-state-balancing",
        "reserve-indicators",
        "chip-supply-map",
        "bay-security-calculation",
      ],
      opinion: [
        "opinion-connectivity-not-port",
        "opinion-climate-finance",
        "opinion-digital-economy-youth",
        "opinion-regional-history",
      ],
    },
    featured: {
      bangladesh: {
        lead: "coastal-embankment-project",
        // One image story, then two stories.
        rail: [
          "dhaka-single-ticket",
          "primary-teacher-training",
          "aman-harvest-north",
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
      "coastal-embankment-project",
      "reserve-indicators",
      "inflation-third-month",
      "chattogram-rain-warning",
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
      bangladesh: { lead: "coastal-embankment-project", rail: [] },
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
      "coastal-embankment-project",
      "reserve-indicators",
    ],
    // 4 regions or fewer after the empty one is removed: no slider buttons.
    regions: ["china", "india", "middle-east", "africa"],
  },
};
