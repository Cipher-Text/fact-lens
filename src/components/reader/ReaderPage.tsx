import Image from "next/image";
import Link from "next/link";

import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { categoryHref } from "@/components/story/links";
import { StoryTime } from "@/components/story/StoryTime";

import type { Article, ReadNextItem } from "@/content/reader";
import { getDictionary, localizedPath, type Lang } from "@/i18n";

import {
  ArticleBody,
  formatNumber,
  KeyPoints,
  PreferredSourceAlert,
  ReadNext,
  Tags,
} from "./ArticleParts";
import { ReadingTools, Toc } from "./Reading";
import { ReaderRoot } from "./ReaderRoot";
import { SelectionShare } from "./SelectionShare";
import { Toaster } from "./Toaster";

type Props = {
  lang: Lang;
  article: Article;
  readNext: ReadNextItem[];
};

/**
 * The wild card article page: a free design that follows the design system on corners
 * (CPT-05) and uses restyled shadcn parts for the context and the share dialog (CPT-16).
 */
export function ReaderPage({ lang, article, readNext }: Props) {
  const site = getDictionary(lang);
  const t = site.reader;
  const { story } = article;
  const path = localizedPath(lang, `/story/${story.slug}`);
  const category = site.categories[story.category];
  const share = { path, title: story.title, summary: article.summary, t };
  const toc = article.body.flatMap((block) =>
    block.type === "h2" ? [{ id: block.id, text: block.text }] : [],
  );

  return (
    <ReaderRoot minutes={article.readingMinutes} category={story.category}>
      <SkipLink label={site.header.skipLink} />
      <SiteHeader lang={lang} path={`/story/${story.slug}`} />
      {/* The top ad row is below the header, full width (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={site.ads} />

      <main id="main">
        <article className="rd-article" data-format={story.format}>
          <header className="rd-hero rd-wrap">
            <div className="rd-hero__text">
              <div className="rd-kicker">
                <Link
                  href={categoryHref(lang, story.category)}
                  className="rd-cat"
                >
                  {category}
                </Link>
              </div>

              <h1 className="rd-title" data-reader-title>
                {story.title}
              </h1>
              <p className="rd-summary">{article.summary}</p>
              {/* Published, updated and reading time, one line under the deck (tajmin,
                  23 Oct 2026). */}
              <div className="rd-deckmeta">
                <dl className="rd-deckmeta__list">
                  <div className="rd-stamp">
                    <dt>{t.published}</dt>
                    <dd>
                      <StoryTime story={story} />
                    </dd>
                  </div>
                  {article.updatedAt ? (
                    <div className="rd-stamp">
                      <dt>{t.updated}</dt>
                      <dd>
                        <StoryTime
                          story={{ publishedAt: article.updatedAt, lang }}
                        />
                      </dd>
                    </div>
                  ) : null}
                  <div className="rd-stamp">
                    <dt className="sr-only">{t.readingTimeLabel}</dt>
                    <dd>
                      {t.readTime.replace(
                        "{n}",
                        formatNumber(article.readingMinutes, lang),
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </header>

          {/* The lead image is required (tajmin, 24 Oct 2026). It keeps its own ratio,
              centered, up to --rd-lead-media-max tall. */}
          <figure className="rd-hero-figure">
            <Image
              src={story.image.src}
              alt={story.image.alt || article.caption}
              width={story.image.width}
              height={story.image.height}
              preload
              fetchPriority="high"
              className="rd-hero-img"
            />
            <figcaption className="rd-caption rd-caption--hero">
              <span>
                {article.caption}{" "}
                <span className="rd-credit">{article.credit}</span>
              </span>
            </figcaption>
          </figure>

          <div className="rd-byrow rd-wrap">
            <div className="rd-hero__text">
              <div className="rd-meta">
                <div className="rd-byline">
                  <span className="rd-avatar" aria-hidden="true">
                    {article.author.initials}
                  </span>
                  <div>
                    <p className="rd-byline__name">
                      <span className="rd-byline__by">{t.by}</span>{" "}
                      {article.author.name}
                    </p>
                    <p className="rd-byline__role">{article.author.role}</p>
                  </div>
                </div>
              </div>

              <div className="rd-actions">
                <PreferredSourceAlert t={t} />
              </div>
            </div>
          </div>

          {/* The body stays in the centered reading column. From 1280 the rail
              (contents, progress, text size) sits in the free space on its left. */}
          <div className="rd-layout rd-wrap">
            <aside className="rd-rail" aria-label={t.contents}>
              <div className="rd-rail__sticky">
                <Toc items={toc} label={t.contents} />
                <ReadingTools
                  {...share}
                  layout="rail"
                  lang={lang}
                  slug={story.slug}
                />
              </div>
            </aside>

            <div className="rd-main" id="article-body" tabIndex={-1}>
              {article.keyPoints ? (
                <KeyPoints points={article.keyPoints} t={t} lang={lang} />
              ) : null}
              <ArticleBody
                blocks={article.body}
                context={article.context}
                ad={<AdSlot variant="inline" lang={lang} strings={site.ads} />}
                t={t}
              />

              <div className="rd-after">
                <Tags tags={article.tags} t={t} lang={lang} />
              </div>
            </div>
          </div>
        </article>

        {/* After the article: one full-width ad-band row (LAY-09). */}
        <AdSlot variant="band" lang={lang} strings={site.ads} />

        <ReadNext items={readNext} t={t} strings={site} />
      </main>

      <Footer lang={lang} />
      <ReadingTools {...share} layout="dock" lang={lang} slug={story.slug} />
      <SelectionShare title={story.title} t={t} />
      <Toaster />
    </ReaderRoot>
  );
}
