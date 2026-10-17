---
name: mock-content
description: Data shape and rules for Fact Lens mock news content in Bangla and English (stories, categories, regions, most read, poll, mock ads). Use when creating or changing files in src/content/ or placeholder images.
user-invocable: false
---

# Mock content

There is no backend (`DR-01`). All content is typed mock data in `src/content/`. Write it so that a backend can replace it later without changes to components.

## Shape

Put the types in `src/content/types.ts`:

```ts
export type Lang = "bn" | "en";
export type Format = "news" | "analysis" | "opinion" | "explainer";

export interface ImageRef {
  src: string;        // /mock/<name>.svg
  alt: string;        // in the story language
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
  image?: ImageRef;    // some stories have no image
}
```

Read content through functions in `src/content/index.ts`, for example `getHomepage(lang)`. Components never import the data files directly.

## Categories and regions

| Id | Bangla | English |
| --- | --- | --- |
| `bangladesh` | বাংলাদেশ | Bangladesh |
| `geopolitics` | ভূরাজনীতি ও কূটনীতি | Geopolitics and Diplomacy |
| `security` | নিরাপত্তা ও সংঘাত | Security and Conflict |
| `history` | ইতিহাস ও প্রেক্ষাপট | History and Context |
| `economy` | অর্থনীতি ও বাণিজ্য | Economy and Trade |
| `technology` | প্রযুক্তি ও কৌশলগত শক্তি | Technology and Strategic Power |

The English labels are working labels until the IA label table exists (`IA-06`). Mark them as `UNRESOLVED_DESIGN_SYSTEM` in `docs/PROGRESS.md`.

Regions are under অঞ্চলসমূহ (Regions). চীন (China) is a region, not a category (`DR-19`). Use 6 or more regions, so that the slider has buttons. Include one region with no stories, which must not show.

## Rules

1. No "Fact Check", ফ্যাক্টচেক, verdicts or ratings (`DR-18`).
2. Write fictional but realistic news about international and bilateral topics. Do not use real people's quotes. Do not write content that could pass as real reporting about a real event.
3. Bangla stories are in Bangla. English stories are in English. Use the same ids for a story and its translation, with a different `lang`.
4. Include the test cases of `spacing-layout-system.md` Section 13: very long Bangla headlines (more than 120 characters), stories with no image, and one sparse variant of each pattern (Section 7.3). Put stories with no image only where the component sheet allows it. Every hero story has an image (`DR-91`).
5. Give each section the item counts of its sheet in `component-system.md` Section 7, for every section in `spacing-layout-system.md` Section 7.1. The poll has 2 to 4 options.
6. Placeholder images are local SVG files in `public/mock/`. Use a neutral fill and the image ratio only. No stock photos and no remote images.
7. Dates are recent and in ISO format. Format them in the component with `Intl` and the page language.
8. No newsletter content in prototype run 4 (`DR-239`).
9. Mock ads: one neutral placeholder creative per `AdSlot` variant (`top`, `band`, `inset`, `rail`), at the sizes in `component-system.md` C-16. The `rail` creative is 300×600 or 300×250 (`DR-241`). No ad network and no remote images.
