import { ArrowUpRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { Fragment, type ReactNode } from "react";

import {
  imageFiles,
  type ArticleContext,
  type Block,
  type ReadNextItem,
  type Topic,
} from "@/content";
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
import { contextPosition } from "./placement";
import { GoogleG } from "./icons";
import { SectionAnchor } from "./Reading";
import type { ReaderStrings } from "@/i18n";
import { formatNumber } from "@/lib/format";

// The domain that Google's preferred-source page should add. Change it to the
// production domain when there is one.
const PREFERRED_SOURCE_DOMAIN = "fact-lens-web-ashy.vercel.app";
export const preferredSourceHref = `https://www.google.com/preferences/source?q=${PREFERRED_SOURCE_DOMAIN}`;

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
        <div className="rd-section-head">
          <h2 id={block.id} data-section>
            {block.text}
          </h2>
          <SectionAnchor
            id={block.id}
            label={t.sectionLink}
            copied={t.linkCopied}
            failed={t.copyFailed}
          />
        </div>
      );
    case "figure":
      return (
        <figure className="rd-figure">
          <Image
            {...imageFiles[block.image]}
            // The caption below says what the image shows; a copy in alt would be read
            // twice. Real alt text wins when a block has it.
            alt={block.alt ?? ""}
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
  const contextAt = contextPosition(blocks);
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
          className="rd-galert__btn font-ui text-xs leading-tight font-semibold"
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

/** C-34 Topics: shadcn Badge links (tajmin, 24 Oct 2026; DR-410). Topic pages do not
 *  exist yet, so the links lead to a 404 page, like the homepage story links (IMP-18). */
export function Topics({
  topics,
  t,
  lang,
}: {
  topics: Topic[];
  t: ReaderStrings;
  lang: Lang;
}) {
  return (
    <div className="rd-topics">
      <p className="rd-eyebrow">{t.topics}</p>
      <ul>
        {topics.map((topic) => (
          <li key={topic.id}>
            <Badge
              render={<a href={localizedPath(lang, `/topic/${topic.slug}`)} />}
            >
              {topic.label}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
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
