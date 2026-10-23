import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReaderPage } from "@/components/reader/ReaderPage";
import { articleSlugs, getArticle, getReadNext } from "@/content/reader";
import { isLang, langs, localizedPath } from "@/i18n";

import "@/styles/reader.css";

// Wild card article page (page/article-parallel): only stories with full text exist.
export const dynamicParams = false;

export function generateStaticParams() {
  return langs.flatMap((lang) => articleSlugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/story/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const article = getArticle(slug, lang);
  if (!article) return {};
  const { story } = article;
  return {
    title: story.title,
    description: article.summary,
    alternates: {
      languages: {
        bn: localizedPath("bn", `/story/${slug}`),
        en: localizedPath("en", `/story/${slug}`),
      },
    },
    openGraph: {
      type: "article",
      title: story.title,
      description: article.summary,
      publishedTime: story.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      tags: article.tags,
    },
  };
}

export default async function StoryPage({
  params,
}: PageProps<"/[lang]/story/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const article = getArticle(slug, lang);
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
    keywords: article.tags.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ReaderPage
        lang={lang}
        article={article}
        readNext={getReadNext(lang)}
      />
    </>
  );
}
