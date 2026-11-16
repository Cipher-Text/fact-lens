import type { PublicNews, PublicMedia } from "@fact-lens/contracts";
import { publicNewsListItemSchema } from "@fact-lens/contracts";
import { categoryIds, regionIds, type CategoryId, type ImageRef, type Lang, type RegionId, type Story } from "@/content/types";

export type PublicNewsListItem = ReturnType<typeof publicNewsListItemSchema.parse>;

export function siteCategory(ref: { key: string } | null): CategoryId | null {
  if (ref === null) return null;
  return (categoryIds as readonly string[]).includes(ref.key) ? (ref.key as CategoryId) : null;
}

export function siteRegions(refs: Array<{ key: string }>): RegionId[] {
  return refs.map(({ key }) => key).filter((key): key is RegionId => (regionIds as readonly string[]).includes(key));
}

export function imageFromMedia(media: PublicMedia | null, _lang: Lang): ImageRef | undefined {
  void _lang;
  if (media === null) return undefined;
  return {
    src: media.urls.card,
    alt: media.alt ?? "",
    width: media.width ?? 800,
    height: media.height ?? 600,
  };
}

export function storyFromListItem(item: PublicNewsListItem, lang: Lang): Story | null {
  const category = siteCategory(item.category);
  if (category === null) return null;
  return {
    id: item.shortId,
    lang,
    slug: item.slug,
    format: item.format,
    category,
    regions: [],
    title: item.title,
    ...(item.dek === null ? {} : { summary: item.dek }),
    publishedAt: item.publishedAt,
    ...(item.image === null ? {} : { image: imageFromMedia(item.image, lang) }),
  };
}

export function storyFromNews(item: PublicNews, lang: Lang): Story | null {
  const category = siteCategory(item.category);
  if (category === null) return null;
  const author = item.contributors.find(({ role }) => role === "author")?.contributor;
  return {
    id: item.shortId,
    lang,
    slug: item.slug,
    format: item.format,
    category,
    regions: siteRegions(item.regions),
    title: item.title,
    ...(item.dek === null ? {} : { summary: item.dek }),
    ...(author === undefined ? {} : { author: { name: author.displayName, slug: author.id } }),
    publishedAt: item.publishedAt,
  };
}
