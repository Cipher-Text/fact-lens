"use client";

import { ArrowUp, Check, Hash } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LensMark } from "./icons";
import { useReading } from "./reading-store";
import { ShareMenu, type ShareProps } from "./Share";
import type { ReaderStrings } from "./strings";
import { TextSize, ThemeToggle } from "./Controls";
import { copyText } from "./Toaster";

const locales = { bn: "bn-BD-u-nu-beng", en: "en-GB" } as const;

function percentText(value: number, lang: "bn" | "en") {
  return new Intl.NumberFormat(locales[lang], {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function numberText(value: number, lang: "bn" | "en") {
  return new Intl.NumberFormat(locales[lang]).format(value);
}

/** The thin line at the very top: how much of the body has been read. */
export function ProgressLine({
  label,
  lang,
}: {
  label: string;
  lang: "bn" | "en";
}) {
  const percent = useReading((s) => s.percent);
  return (
    <div
      className="rd-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={percentText(percent, lang)}
    >
      <span />
    </div>
  );
}

type BarProps = ShareProps & {
  lang: "bn" | "en";
  homeHref: string;
  siteName: string;
  category: string;
  otherHref: string;
  otherLang: "bn" | "en";
};

/**
 * The reading bar. It turns to glass after the first scroll, hides while the reader
 * scrolls down, and shows the headline once the real headline is out of view.
 */
export function ReaderBar({
  lang,
  homeHref,
  siteName,
  category,
  otherHref,
  otherLang,
  ...share
}: BarProps) {
  const { t, title } = share;
  const hidden = useReading((s) => s.hidden);
  const past = useReading((s) => s.past);
  const scrolled = useReading((s) => s.scrolled);

  return (
    <header
      className="rd-bar"
      data-hidden={hidden || undefined}
      data-past={past || undefined}
      data-scrolled={scrolled || undefined}
    >
      <div className="rd-bar__inner">
        <Link
          href={homeHref}
          className="rd-logo"
          aria-label={`${siteName}, ${t.home}`}
        >
          <LensMark />
          <span className="rd-logo__word">{siteName}</span>
        </Link>
        <span className="rd-bar__crumb">
          <span className="rd-dot" aria-hidden="true" />
          {category}
        </span>
        <p className="rd-bar__title" aria-hidden="true">
          {title}
        </p>
        <div className="rd-bar__actions">
          <a
            href={otherHref}
            lang={otherLang}
            hrefLang={otherLang}
            className="rd-langlink"
          >
            {t.otherLanguage}
          </a>
          <ThemeToggle t={t} />
          <ShareMenu {...share} />
        </div>
      </div>
    </header>
  );
}

/** The floating pill: progress ring (back to top), minutes left, text size and share. */
export function ReadingPill({
  lang,
  ...share
}: ShareProps & { lang: "bn" | "en" }) {
  const { t } = share;
  const percent = useReading((s) => s.percent);
  const minutesLeft = useReading((s) => s.minutesLeft);
  const started = useReading((s) => s.started);
  const done = useReading((s) => s.done);

  return (
    <div className="rd-pill" data-show={started || undefined}>
      <button
        type="button"
        className="rd-ringbtn"
        aria-label={`${t.backToTop}. ${t.percentRead.replace("{p}", percentText(percent, lang))}`}
        title={t.backToTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <Ring />
        <span className="rd-ringbtn__pct" aria-hidden="true">
          {done ? <Check /> : numberText(percent, lang)}
        </span>
        <ArrowUp className="rd-ringbtn__up" aria-hidden="true" />
      </button>
      <span className="rd-pill__meta" aria-hidden="true">
        {done
          ? t.finished
          : t.minutesLeft.replace("{n}", numberText(minutesLeft, lang))}
      </span>
      <span className="rd-pill__sep" aria-hidden="true" />
      <TextSize t={t} side="top" />
      <ShareMenu {...share} side="top" />
    </div>
  );
}

/** A ring that fills with --rd-progress. */
export function Ring() {
  return (
    <svg className="rd-ring" viewBox="0 0 36 36" aria-hidden="true">
      <circle
        className="rd-ring__track"
        cx="18"
        cy="18"
        r="16"
        pathLength={100}
      />
      <circle
        className="rd-ring__fill"
        cx="18"
        cy="18"
        r="16"
        pathLength={100}
      />
    </svg>
  );
}

/** The contents list in the rail, with the section being read marked. */
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
      {/* The list's ::before is the track and its ::after the read part. */}
      <ol className="rd-toc__list">
        {items.map((item) => (
          <li key={item.id}>
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
    </nav>
  );
}

/** A small button after a section heading that copies a link to that section. */
export function SectionAnchor({
  id,
  label,
  copied,
}: {
  id: string;
  label: string;
  copied: string;
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
        copyText(url, copied);
      }}
    >
      <Hash aria-hidden="true" />
    </button>
  );
}

/** The card after the body: a ring while reading, a check once the reader is done. */
export function EndCard({
  t,
  lang,
  children,
}: {
  t: ReaderStrings;
  lang: "bn" | "en";
  children?: ReactNode;
}) {
  const percent = useReading((s) => s.percent);
  const done = useReading((s) => s.done);
  return (
    <section className="rd-end" aria-labelledby="rd-end-title">
      <div className="rd-end__ring">
        <Ring />
        <span className="rd-end__pct" aria-hidden="true">
          {done ? (
            <Check className="rd-end__check" />
          ) : (
            numberText(percent, lang)
          )}
        </span>
      </div>
      <div>
        <h2 id="rd-end-title" className="rd-end__title">
          {done
            ? t.endTitle
            : t.percentRead.replace("{p}", percentText(percent, lang))}
        </h2>
        <p className="rd-end__text">{t.endText}</p>
      </div>
      {children}
    </section>
  );
}
