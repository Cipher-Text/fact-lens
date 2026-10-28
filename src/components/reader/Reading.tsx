"use client";

import { ArrowUp, Check, Hash } from "lucide-react";

import { SaveButton, TextSize, TextSizeOptions } from "./Controls";
import { useReading } from "./reading-store";
import { CopyLinkButton, ShareDialog, type ShareProps } from "./Share";
import type { ReaderStrings } from "@/i18n";
import { formatNumber, formatPercent } from "@/lib/format";
import { copyText } from "./Toaster";

/** A square frame that fills clockwise with --rd-progress. */
export function ProgressFrame() {
  return (
    <svg className="rd-frame" viewBox="0 0 40 40" aria-hidden="true">
      <rect
        className="rd-frame__track"
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        pathLength={100}
      />
      <rect
        className="rd-frame__fill"
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        pathLength={100}
      />
    </svg>
  );
}

function ProgressButton({ t, lang }: { t: ReaderStrings; lang: "bn" | "en" }) {
  const percent = useReading((s) => s.percent);
  const done = useReading((s) => s.done);
  return (
    <button
      type="button"
      className="rd-progressbtn"
      aria-label={`${t.backToTop}. ${t.percentRead.replace("{p}", formatPercent(percent, lang))}`}
      title={t.backToTop}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ProgressFrame />
      <span className="rd-progressbtn__pct" aria-hidden="true">
        {done ? <Check /> : formatNumber(percent, lang)}
      </span>
      <ArrowUp className="rd-progressbtn__up" aria-hidden="true" />
    </button>
  );
}

function MinutesLeft({ t, lang }: { t: ReaderStrings; lang: "bn" | "en" }) {
  const minutesLeft = useReading((s) => s.minutesLeft);
  const done = useReading((s) => s.done);
  return (
    <>
      {done
        ? t.finished
        : t.minutesLeft.replace("{n}", formatNumber(minutesLeft, lang))}
    </>
  );
}

/**
 * The reading tools: progress (back to the top), minutes left, text size, share and save.
 * `rail`: in the sticky left panel, from 1280. `dock`: a bar at the bottom edge below 1280,
 * where there is no left panel.
 */
export function ReadingTools({
  layout,
  lang,
  storyId,
  ...share
}: ShareProps & {
  layout: "rail" | "dock";
  lang: "bn" | "en";
  storyId: string;
}) {
  const { t } = share;
  const percent = useReading((s) => s.percent);
  const started = useReading((s) => s.started);

  if (layout === "dock") {
    return (
      <div className="rd-dock" data-show={started || undefined}>
        <ProgressButton t={t} lang={lang} />
        <span className="rd-dock__meta" aria-hidden="true">
          <MinutesLeft t={t} lang={lang} />
        </span>
        <span className="rd-dock__sep" aria-hidden="true" />
        <TextSize t={t} side="top" />
        <ShareDialog {...share} />
        <SaveButton storyId={storyId} t={t} />
      </div>
    );
  }

  return (
    <div className="rd-tools">
      <div className="rd-tools__group">
        <p className="rd-rail__title">{t.reading}</p>
        <div className="rd-tools__progress">
          <ProgressButton t={t} lang={lang} />
          <p className="rd-tools__meta">
            <strong>
              {t.percentRead.replace("{p}", formatPercent(percent, lang))}
            </strong>
            <span>
              <MinutesLeft t={t} lang={lang} />
            </span>
          </p>
        </div>
      </div>
      <div className="rd-tools__group">
        <p className="rd-rail__title" id="rd-size-rail">
          {t.textSize}
        </p>
        <TextSizeOptions t={t} labelledBy="rd-size-rail" />
      </div>
      <div className="rd-tools__group">
        <p className="rd-rail__title">{t.share}</p>
        <div className="rd-tools__row">
          <ShareDialog {...share} />
          <CopyLinkButton path={share.path} t={t} />
          <SaveButton storyId={storyId} t={t} />
        </div>
      </div>
    </div>
  );
}

/**
 * The contents list in the rail. The marker and the filled part of the track follow the
 * reading line through each section (--rd-toc-y, set on scroll by ReaderRoot), so they flow
 * from one heading to the next instead of jumping.
 */
export function Toc({
  items,
  label,
}: {
  items: { id: string; text: string }[];
  label: string;
}) {
  const active = useReading((s) => s.active);
  if (items.length === 0) return null;
  return (
    <nav className="rd-toc" aria-label={label}>
      <p className="rd-rail__title">{label}</p>
      <div className="rd-toc__body" data-toc>
        <span className="rd-toc__marker" aria-hidden="true" />
        <ol className="rd-toc__list">
          {items.map((item) => (
            <li key={item.id} data-toc-item>
              <a
                href={`#${item.id}`}
                className="rd-toc__link"
                aria-current={active === item.id ? "true" : undefined}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

/** A small button after a section heading that copies a link to that section. */
export function SectionAnchor({
  id,
  label,
  copied,
  failed,
}: {
  id: string;
  label: string;
  copied: string;
  failed: string;
}) {
  return (
    <button
      type="button"
      className="rd-anchor"
      aria-label={label}
      title={label}
      onClick={() => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        history.replaceState(null, "", `#${id}`);
        void copyText(url, copied, failed);
      }}
    >
      <Hash aria-hidden="true" />
    </button>
  );
}
