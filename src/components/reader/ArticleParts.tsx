import { ArrowUpRight, History, Sparkles } from "lucide-react";
import Image from "next/image";
import { Fragment, type ReactNode } from "react";

import {
  imageFiles,
  type Article,
  type ArticleContext,
  type Block,
  type ReadNextItem,
} from "@/content/reader";
import { StoryTime } from "@/components/story/StoryTime";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { StoryCard } from "@/components/story/StoryCard";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { localizedPath, type Dictionary, type Lang } from "@/i18n";

import { ContextCard } from "./ContextCard";
import { GoogleG } from "./icons";
import { SectionAnchor } from "./Reading";
import type { ReaderStrings } from "./strings";

const locales = { bn: "bn-BD-u-nu-beng", en: "en-GB" } as const;

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

function BodyBlock({ block, t }: { block: Block; t: ReaderStrings }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
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
    case "figure":
      return (
        <figure className="rd-figure">
          <Image
            {...imageFiles[block.image]}
            alt={block.caption}
            className="rd-figure__img"
          />
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
  }
}

// Inline ads go after these paragraphs (counted from 1). When that paragraph is not
// followed by another paragraph (a heading, image or list comes next), the ad moves to the
// next paragraph that is. Short articles get fewer: no ad after the second-to-last
// paragraph. tajmin, 24 Oct 2026.
const INLINE_AD_AFTER = [3, 10];

function inlineAdPositions(blocks: Block[]) {
  const at = new Set<number>();
  const paragraphs = blocks.filter((block) => block.type === "p").length;
  let count = 0;
  let target = 0;
  blocks.forEach((block, index) => {
    if (block.type !== "p") return;
    count += 1;
    const want = INLINE_AD_AFTER[target];
    if (want === undefined || count < want || count >= paragraphs - 1) return;
    if (blocks[index + 1]?.type !== "p") return;
    at.add(index);
    target += 1;
  });
  return at;
}

export function ArticleBody({
  blocks,
  context,
  ad,
  t,
}: {
  blocks: Block[];
  context?: ArticleContext;
  /** The inline ad row, placed between paragraphs. */
  ad?: ReactNode;
  t: ReaderStrings;
}) {
  // The context goes in the body before the first section heading.
  const contextAt = blocks.findIndex((block) => block.type === "h2");
  const adAt = ad ? inlineAdPositions(blocks) : new Set<number>();
  return (
    <div className="rd-prose" data-reader-body>
      {blocks.map((block, index) => (
        <Fragment key={index}>
          {context && index === contextAt ? (
            <ContextCard context={context} t={t} />
          ) : null}
          <BodyBlock block={block} t={t} />
          {adAt.has(index) ? ad : null}
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

/** The tags: shadcn Badge links (tajmin, 24 Oct 2026). Tag pages do not exist yet, so the
 *  links lead to a 404 page, like the homepage story links. */
export function Tags({
  tags,
  t,
  lang,
}: {
  tags: string[];
  t: ReaderStrings;
  lang: Lang;
}) {
  return (
    <div className="rd-tags">
      <p className="rd-eyebrow">{t.tags}</p>
      <ul>
        {tags.map((tag) => (
          <li key={tag}>
            <Badge
              render={
                <a
                  href={localizedPath(lang, `/tag/${encodeURIComponent(tag)}`)}
                />
              }
            >
              {tag}
            </Badge>
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

/**
 * Read next: a section in the shell with SectionHeading (C-13) and a row of StoryCards
 * (C-24), stacked, 16:9, with the summary. Other pages: 1 card under 600px, 2 from 600px,
 * 3 from 1024px (LAY-07, spacing-layout-system.md 3.3). These stories have no full text
 * in this run, so their links lead to a 404 page, like the homepage story links.
 */
export function ReadNext({
  items,
  t,
  strings,
}: {
  items: ReadNextItem[];
  t: ReaderStrings;
  strings: Dictionary;
}) {
  if (items.length === 0) return null;
  return (
    <Shell
      as="section"
      aria-labelledby="rd-next-title"
      className="rd-next"
      data-read-next
    >
      <SectionHeading id="rd-next-title">{t.readNext}</SectionHeading>
      <ul className="grid grid-cols-1 gap-x-(--grid-column-gap) gap-y-(--grid-row-gap) sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ story }) => (
          <li key={story.id}>
            <StoryCard story={story} strings={strings} />
          </li>
        ))}
      </ul>
    </Shell>
  );
}
