// Read access for the wild card reader page. Joins a story from stories.ts with its
// full article text from reader-articles.ts.
import { getStory } from "./index";
import { articleDefs, readNextIds, type ArticleText } from "./reader-articles";
import { authors } from "./stories";
import type { Lang, Story } from "./types";

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
  story: Story;
  summary: string;
  updatedAt?: string;
  author: ReaderAuthor;
  readingMinutes: number;
}

export interface ReadNextItem {
  story: Story;
}

const byId = new Map(articleDefs.map((def) => [def.id, def]));

export const articleSlugs = articleDefs.map((def) => def.id);

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

export function getArticle(slug: string, lang: Lang): Article | null {
  const def = byId.get(slug);
  if (!def) return null;
  const story = getStory(slug, lang);
  const { summary, authorRole, authorBio, ...text } = def[lang];
  const name = authors[def.author][lang];
  // Bangla is read a little slower per word than English.
  const computed = Math.max(
    1,
    Math.round(wordCount(def[lang]) / (lang === "bn" ? 170 : 230)),
  );

  return {
    ...text,
    story,
    summary: summary ?? story.summary ?? "",
    updatedAt: def.updatedAt,
    author: {
      name,
      role: authorRole,
      bio: authorBio,
      initials: initialsOf(name, lang),
    },
    readingMinutes: story.readingMinutes ?? computed,
  };
}

/**
 * The Read next row. These stories have no full text in this run, so their links
 * lead to a 404 page, like the homepage story links.
 */
export function getReadNext(lang: Lang): ReadNextItem[] {
  return readNextIds.map((id) => ({ story: getStory(id, lang) }));
}
