// The managed topic list (DR-410). A topic answers "what or who"; a region answers
// "where" and a category "which beat" (DR-411). Each topic has one key, one Latin slug
// for /topic/<slug>, and a label in each language. The backend owns the list later.
export const topics = {
  rivers: { slug: "rivers", bn: "নদী", en: "Rivers" },
  monsoon: { slug: "monsoon", bn: "বর্ষা", en: "Monsoon" },
  "flood-forecasting": {
    slug: "flood-forecasting",
    bn: "বন্যার পূর্বাভাস",
    en: "Flood forecasting",
  },
  "regional-cooperation": {
    slug: "regional-cooperation",
    bn: "আঞ্চলিক সহযোগিতা",
    en: "Regional cooperation",
  },
  archives: { slug: "archives", bn: "মহাফেজখানা", en: "Archives" },
  "river-trade": {
    slug: "river-trade",
    bn: "নদীপথের বাণিজ্য",
    en: "River trade",
  },
} as const;

export type TopicId = keyof typeof topics;
