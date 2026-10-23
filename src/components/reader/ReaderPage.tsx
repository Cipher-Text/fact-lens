import { Clock } from "lucide-react";

import type { Article, ReadNextItem } from "@/content/reader";
import {
  getDictionary,
  LANG_QUERY,
  localizedPath,
  otherLang,
  type Lang,
} from "@/i18n";

import { Art } from "./Art";
import {
  ArticleBody,
  AuthorCard,
  formatClock,
  formatDay,
  formatNumber,
  KeyPoints,
  PreferredSourceCard,
  PreferredSourcePill,
  ReaderFooter,
  ReadNext,
  Tags,
  Updates,
} from "./ArticleParts";
import { ContextChip, ContextPanel } from "./ContextPanel";
import { SaveButton, TimeAgo } from "./Controls";
import { anekBangla } from "./fonts";
import { EndCard, ProgressLine, ReaderBar, ReadingPill, Toc } from "./Reading";
import { ReaderRoot } from "./ReaderRoot";
import { SelectionShare } from "./SelectionShare";
import { ShareButtons } from "./Share";
import { readerStrings } from "./strings";
import { Toaster } from "./Toaster";

type Props = {
  lang: Lang;
  article: Article;
  readNext: ReadNextItem[];
};

function titleLength(title: string) {
  if (title.length > 120) return "xl";
  if (title.length > 80) return "l";
  return "m";
}

/** The wild card article page: free design, outside the Fact Lens design system. */
export function ReaderPage({ lang, article, readNext }: Props) {
  const t = readerStrings[lang];
  const site = getDictionary(lang);
  const { story } = article;
  const path = localizedPath(lang, `/story/${story.slug}`);
  const other = otherLang(lang);
  const otherHref = `${localizedPath(other, `/story/${story.slug}`)}?${LANG_QUERY}=${other}`;
  const category = site.categories[story.category];
  const share = { path, title: story.title, summary: article.summary, t };
  const toc = article.body.flatMap((block) =>
    block.type === "h2" ? [{ id: block.id, text: block.text }] : [],
  );

  return (
    <ReaderRoot
      minutes={article.readingMinutes}
      category={story.category}
      className={anekBangla.variable}
    >
      <a className="rd-skip" href="#article-body">
        {t.skip}
      </a>
      <ProgressLine label={t.progressLabel} lang={lang} />
      <ReaderBar
        {...share}
        lang={lang}
        homeHref={localizedPath(lang)}
        siteName={site.site.name}
        category={category}
        otherHref={otherHref}
        otherLang={other}
      />

      <main id="main">
        <article className="rd-article" data-format={story.format}>
          <header className="rd-hero rd-wrap">
            <div className="rd-kicker">
              <span className="rd-cat">
                <span className="rd-dot" aria-hidden="true" />
                {category}
              </span>
              <span className="rd-kicker__sep" aria-hidden="true" />
              <span className="rd-format">{t.formats[story.format]}</span>
              {article.dateline ? (
                <>
                  <span className="rd-kicker__sep" aria-hidden="true" />
                  <span className="rd-dateline">{article.dateline}</span>
                </>
              ) : null}
            </div>

            <h1
              className="rd-title"
              data-reader-title
              data-len={titleLength(story.title)}
            >
              {story.title}
            </h1>
            <p className="rd-summary">{article.summary}</p>

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
              <dl className="rd-stamps">
                <div className="rd-stamp">
                  <dt>{t.published}</dt>
                  <dd>
                    <time dateTime={story.publishedAt}>
                      {formatDay(story.publishedAt, lang)},{" "}
                      {formatClock(story.publishedAt, lang)}
                    </time>
                    <TimeAgo iso={story.publishedAt} lang={lang} />
                  </dd>
                </div>
                {article.updatedAt ? (
                  <div className="rd-stamp">
                    <dt>{t.updated}</dt>
                    <dd>
                      <time dateTime={article.updatedAt}>
                        {formatClock(article.updatedAt, lang)}
                      </time>
                    </dd>
                  </div>
                ) : null}
                <div className="rd-stamp">
                  <dt>
                    <Clock aria-hidden="true" />
                    <span className="sr-only">{t.readingTimeLabel}</span>
                  </dt>
                  <dd>
                    {t.readTime.replace(
                      "{n}",
                      formatNumber(article.readingMinutes, lang),
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rd-actions">
              <ShareButtons {...share} />
              <div className="rd-actions__end">
                {article.context ? <ContextChip t={t} /> : null}
                <SaveButton slug={story.slug} t={t} />
                <PreferredSourcePill t={t} />
              </div>
            </div>
          </header>

          <figure className="rd-hero-figure">
            <div className="rd-hero-art">
              <Art
                name={article.art}
                uid="hero"
                label={story.image?.alt || article.caption}
              />
            </div>
            <figcaption className="rd-caption rd-caption--hero">
              <span>
                {article.caption} <span className="rd-credit">{article.credit}</span>
              </span>
            </figcaption>
          </figure>

          <div className="rd-layout rd-wrap">
            <aside className="rd-rail" aria-label={t.contents}>
              <div className="rd-rail__sticky">
                <Toc items={toc} label={t.contents} />
                <div>
                  <p className="rd-rail__title">{t.share}</p>
                  <div className="rd-rail__share">
                    <ShareButtons {...share} layout="rail" />
                    <SaveButton slug={story.slug} t={t} compact />
                  </div>
                </div>
              </div>
            </aside>

            <div className="rd-main" id="article-body" tabIndex={-1}>
              {article.keyPoints ? (
                <KeyPoints points={article.keyPoints} t={t} lang={lang} />
              ) : null}
              {article.context ? (
                <ContextPanel context={article.context} t={t} />
              ) : null}
              <ArticleBody blocks={article.body} t={t} />

              <div className="rd-after">
                <EndCard t={t} lang={lang} />
                <Tags tags={article.tags} t={t} />
                {article.updates ? (
                  <Updates updates={article.updates} t={t} lang={lang} />
                ) : null}
                <div className="rd-sharebox">
                  <p className="rd-eyebrow">{t.shareStory}</p>
                  <ShareButtons {...share} />
                </div>
                <PreferredSourceCard t={t} />
                <AuthorCard article={article} t={t} />
              </div>
            </div>
          </div>
        </article>

        <ReadNext
          items={readNext}
          t={t}
          lang={lang}
          categories={site.categories}
        />
      </main>

      <ReaderFooter t={t} lang={lang} siteName={site.site.name} />
      <ReadingPill {...share} lang={lang} />
      <SelectionShare title={story.title} t={t} />
      <Toaster />
    </ReaderRoot>
  );
}
