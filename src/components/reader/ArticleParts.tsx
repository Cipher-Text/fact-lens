import { ArrowUpRight, History, Sparkles } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import type {
  Article,
  ArticleContext,
  Block,
  ReadNextItem,
} from "@/content/reader";
import { StoryTime } from "@/components/story/StoryTime";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { localizedPath, type Lang } from "@/i18n";

import { Art } from "./Art";
import { ContextCard } from "./ContextCard";
import { GoogleG, LensMark } from "./icons";
import { SectionAnchor } from "./Reading";
import type { ReaderStrings } from "./strings";

const locales = { bn: "bn-BD-u-nu-beng", en: "en-GB" } as const;
const TIME_ZONE = "Asia/Dhaka";

// The domain that Google's preferred-source page should add. Change it to the
// production domain when there is one.
const PREFERRED_SOURCE_DOMAIN = "fact-lens-web-ashy.vercel.app";
export const preferredSourceHref = `https://www.google.com/preferences/source?q=${PREFERRED_SOURCE_DOMAIN}`;

export function formatNumber(value: number, lang: Lang, digits = 1) {
  return new Intl.NumberFormat(locales[lang], {
    minimumIntegerDigits: digits,
  }).format(value);
}

export function KeyPoints({
  points,
  t,
  lang,
}: {
  points: string[];
  t: ReaderStrings;
  lang: Lang;
}) {
  return (
    <section className="rd-points" aria-labelledby="rd-points-title">
      <div className="rd-points__head">
        <h2 id="rd-points-title" className="rd-points__title">
          <Sparkles aria-hidden="true" />
          {t.keyPoints}
        </h2>
        <span className="rd-points__note">{t.keyPointsNote}</span>
      </div>
      <ol>
        {points.map((point, index) => (
          <li key={point}>
            <span className="rd-points__n" aria-hidden="true">
              {formatNumber(index + 1, lang, 2)}
            </span>
            <p>{point}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BodyBlock({
  block,
  last,
  t,
  uid,
}: {
  block: Block;
  last: boolean;
  t: ReaderStrings;
  uid: string;
}) {
  switch (block.type) {
    case "p":
      return (
        <p>
          {block.text}
          {last ? (
            <span className="rd-endmark" role="img" aria-label={t.articleEnd} />
          ) : null}
        </p>
      );
    case "h2":
      return (
        <h2 id={block.id} data-section>
          {block.text}
          <SectionAnchor
            id={block.id}
            label={t.sectionLink}
            copied={t.linkCopied}
          />
        </h2>
      );
    case "quote":
      return (
        <figure className="rd-quote">
          <blockquote>
            <p>{block.text}</p>
          </blockquote>
        </figure>
      );
    case "stats":
      return (
        <div className="rd-stats">
          {block.items.map((item) => (
            <div className="rd-stat" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      );
    case "figure":
      return (
        <figure className="rd-figure">
          <div className="rd-figure__art">
            <Art name={block.art} uid={uid} label={block.caption} />
          </div>
          <figcaption className="rd-caption">
            <span>
              {block.caption} <span className="rd-credit">{block.credit}</span>
            </span>
          </figcaption>
        </figure>
      );
    case "list":
      return (
        <ul className="rd-list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "note":
      return (
        <aside className="rd-note">
          <h3>{block.title}</h3>
          <p>{block.text}</p>
        </aside>
      );
  }
}

export function ArticleBody({
  blocks,
  context,
  t,
}: {
  blocks: Block[];
  context?: ArticleContext;
  t: ReaderStrings;
}) {
  const lastParagraph = blocks.findLastIndex((block) => block.type === "p");
  // The context goes in the body before the first section heading.
  const contextAt = blocks.findIndex((block) => block.type === "h2");
  return (
    <div className="rd-prose" data-reader-body>
      {blocks.map((block, index) => (
        <Fragment key={index}>
          {context && index === contextAt ? (
            <ContextCard context={context} t={t} />
          ) : null}
          <BodyBlock
            block={block}
            last={index === lastParagraph}
            t={t}
            uid={`body-${index}`}
          />
        </Fragment>
      ))}
    </div>
  );
}

/** The preferred-source prompt below the byline: a shadcn Alert with the Google button. */
export function PreferredSourceAlert({ t }: { t: ReaderStrings }) {
  return (
    // A standing prompt, not an urgent message, so it is a note and not an alert.
    <Alert role="note" className="rd-galert">
      <AlertTitle>{t.googleCardTitle}</AlertTitle>
      <AlertDescription>{t.googleCardText}</AlertDescription>
      <AlertAction>
        <a
          className="rd-galert__btn type-button"
          href={preferredSourceHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GoogleG className="rd-galert__g" />
          {t.googleShort}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </AlertAction>
    </Alert>
  );
}

export function PreferredSourceCard({ t }: { t: ReaderStrings }) {
  return (
    <section className="rd-gcard" aria-labelledby="rd-gcard-title">
      <span className="rd-gcard__g" aria-hidden="true">
        <GoogleG />
      </span>
      <div>
        <h2 id="rd-gcard-title">{t.googleCardTitle}</h2>
        <p>{t.googleCardText}</p>
        <a
          className="rd-gbtn"
          href={preferredSourceHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="rd-gbtn__g">
            <GoogleG />
          </span>
          {t.googleButton}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

export function AuthorCard({
  article,
  t,
}: {
  article: Article;
  t: ReaderStrings;
}) {
  const { author } = article;
  return (
    <section className="rd-author" aria-labelledby="rd-author-name">
      <span className="rd-avatar rd-avatar--lg" aria-hidden="true">
        {author.initials}
      </span>
      <div>
        <p className="rd-eyebrow">{t.aboutAuthor}</p>
        <h2 id="rd-author-name" className="rd-author__name">
          {author.name}
        </h2>
        <p className="rd-author__role">{author.role}</p>
        <p className="rd-author__bio">{author.bio}</p>
      </div>
    </section>
  );
}

export function Tags({ tags, t }: { tags: string[]; t: ReaderStrings }) {
  return (
    <div className="rd-tags">
      <p className="rd-eyebrow">{t.tags}</p>
      <ul>
        {tags.map((tag) => (
          <li key={tag}>
            <span className="rd-tag">{tag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Updates({
  updates,
  t,
  lang,
}: {
  updates: { at: string; text: string }[];
  t: ReaderStrings;
  lang: Lang;
}) {
  return (
    <details className="rd-updates">
      <summary>
        <History aria-hidden="true" />
        {t.updates}
      </summary>
      <ol>
        {updates.map((update) => (
          <li key={update.at}>
            <StoryTime story={{ publishedAt: update.at, lang }} />
            <p>{update.text}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function ReadNext({
  items,
  t,
  lang,
  categories,
}: {
  items: ReadNextItem[];
  t: ReaderStrings;
  lang: Lang;
  categories: Record<string, string>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="rd-next" aria-labelledby="rd-next-title">
      <div className="rd-wrap">
        <div className="rd-next__head">
          <h2 id="rd-next-title" className="rd-next__title">
            {t.readNext}
          </h2>
          <span className="rd-next__note">{t.readNextNote}</span>
        </div>
        <div className="rd-next__grid">
          {items.map((item, index) => (
            <article
              key={item.story.id}
              className={index === 0 ? "rd-card rd-card--lead" : "rd-card"}
              data-cat={item.story.category}
            >
              <div className="rd-card__art">
                <Art name={item.art} uid={`next-${index}`} />
              </div>
              <div className="rd-card__body">
                <p className="rd-card__kicker">
                  <span className="rd-dot" aria-hidden="true" />
                  {categories[item.story.category]} ·{" "}
                  {t.formats[item.story.format]}
                </p>
                <h3 className="rd-card__title">
                  <Link href={localizedPath(lang, `/story/${item.story.slug}`)}>
                    {item.story.title}
                  </Link>
                </h3>
                <p className="rd-card__meta">
                  {[
                    item.story.author?.name,
                    item.story.readingMinutes
                      ? t.readTime.replace(
                          "{n}",
                          formatNumber(item.story.readingMinutes, lang),
                        )
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReaderFooter({
  t,
  lang,
  siteName,
}: {
  t: ReaderStrings;
  lang: Lang;
  siteName: string;
}) {
  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date());
  const yearText = new Intl.NumberFormat(locales[lang], {
    useGrouping: false,
  }).format(Number(year));
  return (
    <footer className="rd-footer">
      <div className="rd-wrap rd-footer__inner">
        <div>
          <Link href={localizedPath(lang)} className="rd-logo rd-logo--footer">
            <LensMark />
            <span className="rd-logo__word">{siteName}</span>
          </Link>
          <p className="rd-footer__tag">{t.tagline}</p>
        </div>
        <p className="rd-footer__rights">
          {t.rights.replace("{year}", yearText)}
        </p>
      </div>
    </footer>
  );
}
