import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ReaderPage } from "@/components/reader/ReaderPage";
import { ViewBeacon } from "@/components/reader/ViewBeacon";
import {
  articleLangsOf,
  articleRefs,
  getArticleByRef,
  getReadNext,
} from "@/content";
import { isLang, localizedPath } from "@/i18n";
import { apiBase, ApiNotFound } from "@/lib/api/client";
import { articleFromApi } from "@/lib/api/article";

import "@/styles/reader.css";

// Wild card article page (page/article-parallel): only stories with full text exist.
// The [slug] segment holds "<slug>-<id>" (layout 7C, DR-413). The page finds the article
// by <id>. A wrong or old slug never gets here: the proxy sends a 301 (src/proxy.ts). An
// unknown id, or a language the article does not exist in, gives a 404 (DR-401).
// Next requires this route config to be a static literal. Unknown mock refs still resolve
// to notFound below, while API mode needs arbitrary refs to reach the API.
export const dynamicParams = true;

export function generateStaticParams() {
  if (apiBase()) return [];
  return articleRefs.flatMap(({ ref, langs }) =>
    langs.map((lang) => ({ lang, slug: ref })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/story/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  if (apiBase()) {
    try {
      const result = await articleFromApi(slug, lang);
      if ("redirectTo" in result) return {};
      const { article } = result;
      return { title: article.story.title, description: article.summary };
    } catch (error) {
      if (error instanceof ApiNotFound) return {};
      throw error;
    }
  }
  const article = getArticleByRef(slug, lang);
  if (!article) return {};
  const { story } = article;
  return {
    title: story.title,
    description: article.summary,
    // hreflang only to the languages the article exists in (DR-401).
    alternates: {
      languages: Object.fromEntries(
        articleLangsOf(story.slug).map((other) => [
          other,
          localizedPath(other, `/story/${slug}`),
        ]),
      ),
    },
    openGraph: {
      type: "article",
      title: story.title,
      description: article.summary,
      publishedTime: story.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      // Open Graph names this field "tags" (article:tag); it holds the topic labels.
      tags: article.topics.map((topic) => topic.label),
    },
  };
}

export default async function StoryPage({
  params,
}: PageProps<"/[lang]/story/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  if (apiBase()) {
    let result;
    try {
      result = await articleFromApi(slug, lang);
    } catch (error) {
      if (error instanceof ApiNotFound) notFound();
      throw error;
    }
    if ("redirectTo" in result) redirect(localizedPath(lang, `/story/${result.redirectTo}`));
    const { article } = result;
    const jsonLd = {
      "@context": "https://schema.org", "@type": article.story.format === "opinion" ? "OpinionNewsArticle" : "NewsArticle",
      headline: article.story.title, description: article.summary, inLanguage: lang,
      datePublished: article.story.publishedAt, dateModified: article.updatedAt ?? article.story.publishedAt,
      author: [{ "@type": "Person", name: article.author.name }], keywords: article.topics.map((topic) => topic.label).join(", "),
    };
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><ViewBeacon shortId={article.story.id} locale={lang} /><ReaderPage lang={lang} article={article} readNext={[]} /></>;
  }
  const article = getArticleByRef(slug, lang);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":
      article.story.format === "opinion" ? "OpinionNewsArticle" : "NewsArticle",
    headline: article.story.title,
    description: article.summary,
    inLanguage: lang,
    datePublished: article.story.publishedAt,
    dateModified: article.updatedAt ?? article.story.publishedAt,
    author: [{ "@type": "Person", name: article.author.name }],
    keywords: article.topics.map((topic) => topic.label).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ReaderPage lang={lang} article={article} readNext={getReadNext(lang)} />
    </>
  );
}
