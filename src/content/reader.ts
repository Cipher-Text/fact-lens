// Read access for the wild card reader page. Joins a story from stories.ts with its
// full article text from reader-articles.ts.
import { getStory } from "./index";
import { articleDefs, readNextSlugs, type ArticleText } from "./reader-articles";
import { authors } from "./stories";
import { topics } from "./topics";
import type { ImageRef, Lang, Story, Topic } from "./types";

export type { ArticleContext, Block } from "./reader-articles";
export { imageFiles } from "./stories";

export interface ReaderAuthor {
  name: string;
  role: string;
  bio: string;
  initials: string;
}

export interface Article extends Omit<
  ArticleText,
  "summary" | "authorRole" | "authorBio"
> {
  /** The lead image is required on an article page; body images stay optional
   *  (tajmin, 24 Oct 2026). Homepage stories may still have no image. */
  story: Story & { image: ImageRef };
  summary: string;
  updatedAt?: string;
  author: ReaderAuthor;
  readingMinutes: number;
  topics: Topic[];
}

export interface ReadNextItem {
  story: Story;
}

const bySlug = new Map(articleDefs.map((def) => [def.slug, def]));

/** The story slugs that have full text, with the languages each one exists in. */
export const articleLangs: { slug: string; langs: Lang[] }[] = articleDefs.map(
  (def) => ({
    slug: def.slug,
    langs: (["bn", "en"] as const).filter((lang) => def[lang] !== undefined),
  }),
);

/** Two letters for an English name; the first letter, with its vowel sign, for Bangla. */
function initialsOf(name: string, lang: Lang): string {
  const segmenter = new Intl.Segmenter(lang, { granularity: "grapheme" });
  const first = (word: string) =>
    segmenter.segment(word)[Symbol.iterator]().next().value?.segment ?? "";
  const words = name.split(/\s+/).filter(Boolean);
  if (lang === "bn") return first(words[0] ?? "");
  return words
    .slice(0, 2)
    .map((word) => first(word).toUpperCase())
    .join("");
}

function wordCount(text: ArticleText): number {
  return text.body
    .map((block) => ("text" in block ? block.text : ""))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** The article in one language, or null when it does not exist in that language (DR-401). */
export function getArticle(slug: string, lang: Lang): Article | null {
  const def = bySlug.get(slug);
  const text = def?.[lang];
  if (!def || !text) return null;
  const story = getStory(slug, lang);
  // Editors must add a lead image before an article can be published.
  const { image } = story;
  if (!image)
    throw new Error(`Article without a lead image: ${slug} (${lang})`);
  const { summary, authorRole, authorBio, ...rest } = text;
  const name = authors[def.author][lang];
  // Bangla is read a little slower per word than English.
  const computed = Math.max(
    1,
    Math.round(wordCount(text) / (lang === "bn" ? 170 : 230)),
  );

  return {
    ...rest,
    story: { ...story, image },
    summary: summary ?? story.summary ?? "",
    updatedAt: def.updatedAt,
    author: {
      name,
      role: authorRole,
      bio: authorBio,
      initials: initialsOf(name, lang),
    },
    readingMinutes: story.readingMinutes ?? computed,
    topics: def.topics.map((id) => ({
      id,
      slug: topics[id].slug,
      label: topics[id][lang],
    })),
  };
}

/**
 * The Read next row. These stories have no full text in this run, so their links
 * lead to a 404 page, like the homepage story links.
 */
export function getReadNext(lang: Lang): ReadNextItem[] {
  return readNextSlugs.map((slug) => ({ story: getStory(slug, lang) }));
}
