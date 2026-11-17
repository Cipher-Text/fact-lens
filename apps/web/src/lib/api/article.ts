import { publicNewsSchema, type PublicNews, type PublicMedia } from "@fact-lens/contracts";
import type { Article, Block } from "@/content";
import type { Lang, Topic } from "@/content/types";
import { storyFromNews } from "./adapters";
import { apiGet, apiLocale, ApiRedirect } from "./client";

function plainText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const value = node as { text?: unknown; content?: unknown };
  if (typeof value.text === "string") return value.text;
  return Array.isArray(value.content) ? value.content.map(plainText).join("") : "";
}

function slugBase(text: string): string {
  return text.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "") || "section";
}

export function blocksFromBody(body: PublicNews["body"], media: PublicNews["media"], _lang: Lang): { blocks: Block[]; dropped: string[] } {
  void _lang;
  const byId = new Map(media.map((item) => [item.id, item]));
  const blocks: Block[] = [];
  const dropped: string[] = [];
  const ids = new Set<string>();
  const unique = (text: string) => {
    const base = slugBase(text);
    let id = base;
    let i = 2;
    while (ids.has(id)) id = `${base}-${i++}`;
    ids.add(id);
    return id;
  };
  const content = body.content as unknown as Array<{ type?: string; attrs?: Record<string, unknown>; content?: unknown }>;
  for (const node of content) {
    const type = node.type ?? "unknown";
    if (type === "paragraph") {
      const text = plainText(node);
      if (text) blocks.push({ type: "p", text });
    } else if (type === "heading") {
      const text = plainText(node);
      if (text) blocks.push({ type: "h2", id: unique(text), text });
    } else if (type === "blockquote") {
      const text = plainText(node);
      if (text) blocks.push({ type: "p", text });
    } else if (type === "bulletList" || type === "orderedList") {
      const items = (node.content ?? [] as unknown[] as never) as Array<{ content?: unknown }>;
      const values = items.map(plainText).filter(Boolean);
      if (values.length) blocks.push({ type: "list", items: values });
    } else if (type === "image") {
      const asset = byId.get(String(node.attrs?.mediaAssetId ?? ""));
      if (!asset) continue;
      // The reader's current Block type only allows mock image keys; preserve the API image
      // payload for the reader renderer without widening the mock content contract.
      const image = { src: asset.urls.card, width: asset.width ?? 800, height: asset.height ?? 600 } as unknown as Block & never;
      blocks.push({ type: "figure", image, caption: asset.alt ?? "", credit: asset.attribution ?? "", alt: asset.alt ?? "" } as Block);
    } else if (type !== "horizontalRule") dropped.push(type);
  }
  return { blocks, dropped };
}

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? "").join("");
}

function mediaImage(media: PublicMedia) {
  return { src: media.urls.card, alt: media.alt ?? "", width: media.width ?? 800, height: media.height ?? 600 };
}

export function articleFromNews(item: PublicNews, lang: Lang): Article | null {
  const { blocks } = blocksFromBody(item.body, item.media, lang);
  const lead = item.leadImage ?? item.media.find((m) => blocks.some((b) => b.type === "figure" && (b.image as unknown as { src?: string }).src === m.urls.card));
  if (!lead) return null;
  const story = storyFromNews(item, lang);
  if (!story) return null;
  const contributor = item.contributors.find(({ role }) => role === "author");
  const authorName = contributor?.contributor.displayName ?? "";
  const topics: Topic[] = item.tags.map(({ slug, name }) => ({ id: slug, slug, label: name }));
  return {
    story: { ...story, image: mediaImage(lead) },
    summary: item.dek ?? "",
    updatedAt: item.updatedAt,
    author: { name: authorName, role: contributor?.role ?? "", bio: contributor?.contributor.bio ?? "", initials: initials(authorName) },
    authorRole: contributor?.role ?? "",
    authorBio: contributor?.contributor.bio ?? "",
    caption: item.leadImage?.alt ?? "",
    credit: item.leadImage?.attribution ?? item.leadImage?.license ?? "",
    body: blocks,
    updates: item.corrections.map(({ approvedAt, notice }) => ({ at: approvedAt, text: notice })),
    readingMinutes: item.readingMinutes,
    topics,
  } as Article;
}

export async function articleFromApi(ref: string, lang: Lang): Promise<{ article: Article } | { redirectTo: string }> {
  try {
    const item = await apiGet(`/public/news/${apiLocale(lang)}/${encodeURIComponent(ref)}`, publicNewsSchema, { redirect: "manual" });
    if (process.env.NODE_ENV === "development") {
      const { dropped } = blocksFromBody(item.body, item.media, lang);
      if (dropped.length) console.warn("Dropped unsupported public article body nodes", { ref, lang, dropped });
    }
    const article = articleFromNews(item, lang);
    if (!article) {
      console.error(`Public article has no lead or body image: ${ref} (${apiLocale(lang)})`);
      throw new Error(`Public article has no usable image: ${ref} (${apiLocale(lang)})`);
    }
    return { article };
  } catch (error) {
    if (error instanceof ApiRedirect) {
      const location = new URL(error.location, "http://fact-lens.invalid");
      const segments = location.pathname.split("/").filter(Boolean);
      return { redirectTo: decodeURIComponent(segments.at(-1) ?? "") };
    }
    throw error;
  }
}
