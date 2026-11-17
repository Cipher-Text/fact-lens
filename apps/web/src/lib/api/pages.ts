import { mostReadSchema, publicNewsListSchema } from "@fact-lens/contracts";
import type { AnalysisPage, CategoryId, CategoryPage, Lang, Story, TopicPage } from "@/content/types";
import { storyFromListItem } from "./adapters";
import { apiGet, apiLocale } from "./client";

async function newsList(path: string, lang: Lang): Promise<Story[]> {
  const result = await apiGet(path, publicNewsListSchema);
  return result.items.flatMap((item) => {
    const story = storyFromListItem(item, lang);
    return story ? [story] : [];
  });
}

export async function categoryPageFromApi(category: CategoryId, lang: Lang): Promise<CategoryPage> {
  const key = encodeURIComponent(category);
  const [news, analysis, opinion, mostRead] = await Promise.all([
    newsList(`/public/news/${apiLocale(lang)}?category=${key}&format=news&limit=50`, lang),
    newsList(`/public/news/${apiLocale(lang)}?category=${key}&format=analysis&limit=5`, lang),
    newsList(`/public/news/${apiLocale(lang)}?category=${key}&format=opinion&limit=5`, lang),
    apiGet(`/public/most-read/${apiLocale(lang)}?category=${key}&limit=5`, mostReadSchema),
  ]);
  const all = [...news, ...analysis].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const newsOnly = all.filter((story) => story.format === "news");
  const cover = newsOnly.find((story) => story.image) ?? null;
  const rest = newsOnly.filter((story) => story !== cover);
  const latest = rest.slice(0, 5);
  const cards = rest.slice(5).filter((story) => story.image).slice(0, 3);
  const shown = new Set([cover, ...latest, ...cards, ...analysis]);
  const more = [...all, ...analysis]
    .filter((story) => story.format !== "opinion" && !shown.has(story))
    .slice(0, 10);
  return {
    lang, category, cover, latest, cards, analysis, opinion,
    mostRead: mostRead.items.flatMap((item) => {
      const story = storyFromListItem(item, lang);
      return story ? [{ ...story, rank: item.rank }] : [];
    }),
    more,
  };
}

export async function analysisPageFromApi(lang: Lang): Promise<AnalysisPage> {
  const all = await newsList(`/public/news/${apiLocale(lang)}?format=analysis&limit=50`, lang);
  return { lang, cover: all[0] ?? null, top: all.slice(1, 5), more: all.slice(5, 15) };
}

export async function topicPageFromApi(slug: string, lang: Lang): Promise<TopicPage | null> {
  const result = await apiGet(`/public/news/${apiLocale(lang)}?tag=${encodeURIComponent(slug)}&limit=50`, publicNewsListSchema);
  if (result.filter?.type !== "tag") return null;
  return {
    lang,
    topic: { id: result.filter.slug, slug: result.filter.slug, label: result.filter.name },
    stories: result.items.flatMap((item) => {
      const story = storyFromListItem(item, lang);
      return story && story.format !== "opinion" ? [story] : [];
    }),
  };
}
