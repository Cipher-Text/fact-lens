import { mostReadSchema, publicNewsListSchema, publicRegionListSchema } from "@fact-lens/contracts";
import { getPoll } from "@/content";
import { categoryIds, regionIds, type AnalysisOpinionSection, type CategoryBlock, type FeaturedSection, type Homepage, type Lang, type RegionBlock, type RegionId, type RegionPage, type RegionsPage, type Story } from "@/content/types";
import { storyFromListItem } from "./adapters";
import { apiGet, apiLocale } from "./client";

async function newsList(path: string, lang: Lang, region?: RegionId): Promise<Story[]> {
  const result = await apiGet(path, publicNewsListSchema);
  return result.items.flatMap((item) => {
    const story = storyFromListItem(item, lang);
    return story ? [{ ...story, ...(region ? { regions: [region] } : {}) }] : [];
  });
}

function featured(source: FeaturedSection["source"], stories: Story[]): FeaturedSection | null {
  return stories.length ? { source, feature: stories[0], rail: stories.slice(1, 4) } : null;
}

function nonEmpty<T>(items: T[]): T[] | null {
  return items.length ? items : null;
}

export async function homepageFromApi(lang: Lang): Promise<Homepage> {
  const query = (params: string) => `/public/news/${apiLocale(lang)}?${params}`;
  const [news, analysis, opinion, southAsia, geopolitics, categories, mostRead, regions] = await Promise.all([
    newsList(query("format=news&limit=50"), lang),
    newsList(query("format=analysis&limit=3"), lang),
    newsList(query("format=opinion&limit=3"), lang),
    newsList(query("region=asia&excludeFormat=opinion&limit=4"), lang, "asia"),
    newsList(query("category=geopolitics&excludeFormat=opinion&limit=4"), lang),
    Promise.all(categoryIds.map(async (category) => ({ category, stories: await newsList(query(`category=${category}&format=news&limit=3`), lang) }))),
    apiGet(`/public/most-read/${apiLocale(lang)}?limit=5`, mostReadSchema),
    apiGet(`/public/regions/${apiLocale(lang)}`, publicRegionListSchema),
  ]);
  const leadIndex = news.findIndex((story) => story.image !== undefined);
  const heroStories = leadIndex < 0 ? [] : [news[leadIndex], ...news.filter((_, index) => index !== leadIndex)];
  const mostReadStories = mostRead.items.flatMap((item) => {
    const story = storyFromListItem(item, lang);
    return story ? [{ ...story, rank: item.rank }] : [];
  });
  const availableRegions = regions.map(({ key }) => key).filter((key): key is RegionId => (regionIds as readonly string[]).includes(key));
  const regionBlocks = (await Promise.all(availableRegions.map(async (region): Promise<RegionBlock> => ({
    region,
    stories: await newsList(query(`region=${encodeURIComponent(region)}&excludeFormat=opinion&limit=3`), lang, region),
  })))).filter((block) => block.stories.length > 0);
  const categoryBlocks: CategoryBlock[] = categories.filter((block) => block.stories.length > 0);
  const analysisOpinion: AnalysisOpinionSection | null = analysis.length || opinion.length ? { analysis, opinion } : null;
  return {
    lang,
    hero: heroStories.length ? { lead: heroStories[0], top: heroStories.slice(1, 3), latest: heroStories.slice(3, 8) } : null,
    analysisOpinion,
    featured: {
      southAsia: featured({ kind: "region", id: "asia" }, southAsia),
      geopolitics: featured({ kind: "category", id: "geopolitics" }, geopolitics),
    },
    grouped: categoryBlocks.length ? { categories: categoryBlocks, poll: getPoll(lang) } : null,
    mostRead: nonEmpty(mostReadStories),
    regions: nonEmpty(regionBlocks),
  };
}

export async function regionsPageFromApi(lang: Lang): Promise<RegionsPage> {
  const [all, regions] = await Promise.all([
    newsList(`/public/news/${apiLocale(lang)}?excludeFormat=opinion&limit=50`, lang),
    apiGet(`/public/regions/${apiLocale(lang)}`, publicRegionListSchema),
  ]);
  const cover = all.find((story) => story.image !== undefined) ?? null;
  const latest = all.filter((story) => story !== cover).slice(0, 5);
  const availableRegions = regions.map(({ key }) => key).filter((key): key is RegionId => (regionIds as readonly string[]).includes(key));
  const blocks = (await Promise.all(availableRegions.map(async (region): Promise<RegionBlock> => ({
    region,
    stories: await newsList(`/public/news/${apiLocale(lang)}?region=${encodeURIComponent(region)}&excludeFormat=opinion&limit=3`, lang, region),
  })))).filter((block) => block.stories.length > 0);
  return { lang, cover, latest, regions: blocks };
}

export async function regionPageFromApi(lang: Lang, slug: string): Promise<RegionPage | undefined> {
  if (!(regionIds as readonly string[]).includes(slug)) return undefined;
  const region = slug as RegionId;
  const stories = await newsList(`/public/news/${apiLocale(lang)}?region=${encodeURIComponent(region)}&excludeFormat=opinion&limit=20`, lang, region);
  return { lang, region, stories: stories.slice(0, 10) };
}
