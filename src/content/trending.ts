import type { Lang } from "./types";

// Mock trending search terms for the SearchDialog (component-system.md C-20: up to 6).
// Editorial or analytics list, later (DR-190 to DR-192).
export const trendingTerms: Record<Lang, string[]> = {
  bn: [
    "বঙ্গোপসাগর",
    "ভূরাজনীতি",
    "বাণিজ্য চুক্তি",
    "জ্বালানি নিরাপত্তা",
    "রোহিঙ্গা সংকট",
    "সাইবার নিরাপত্তা",
  ],
  en: [
    "Bay of Bengal",
    "Geopolitics",
    "Trade deal",
    "Energy security",
    "Rohingya crisis",
    "Cyber security",
  ],
};
