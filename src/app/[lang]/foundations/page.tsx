import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LanguageSwitch } from "@/components/header/LanguageSwitch";
import { ThemeSwitch } from "@/components/header/ThemeSwitch";
import { getDictionary, isLang, langs, type Lang } from "@/i18n";
import { formatDate, formatNumber } from "@/lib/format";

import { TokenValue } from "./TokenValue";
import { colorTokens, samples, typeRoles, type ColorGroup } from "./tokens";

// Temporary page for FL-02: every color token and type role in both languages.
// Remove in FL-13.

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/foundations">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: getDictionary(lang).foundations.title,
    robots: { index: false },
  };
}

const SAMPLE_NUMBER = 1234567.5;
const SAMPLE_DATE = new Date("2026-10-07T12:00:00+06:00");

export default async function FoundationsPage({
  params,
}: PageProps<"/[lang]/foundations">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDictionary(lang);
  const f = t.foundations;
  const sampleLangs: { code: Lang; label: string }[] = [
    { code: "bn", label: f.bangla },
    { code: "en", label: f.english },
  ];

  return (
    <main className="shell flex flex-col gap-(--space-section) py-(--space-page-start)">
      <header className="flex flex-col gap-(--space-story-title-meta)">
        <div className="flex flex-wrap items-center gap-4">
          <LanguageSwitch lang={lang} path="/foundations" />
          <ThemeSwitch strings={t.theme} />
        </div>
        <h1 className="type-page-title text-ink">{f.title}</h1>
        <p className="type-ui text-ink-secondary">{f.note}</p>
      </header>

      <section
        aria-labelledby="colors"
        className="flex flex-col gap-(--space-section-title-after)"
      >
        <h2 id="colors" className="type-section-title text-ink">
          {f.colorsTitle}
        </h2>
        {(Object.keys(colorTokens) as ColorGroup[]).map((group) => (
          <div key={group} className="flex flex-col gap-(--space-list-item)">
            <h3 className="type-eyebrow text-ink-muted">{f.groups[group]}</h3>
            <ul className="grid gap-(--space-list-item) sm:grid-cols-2 lg:grid-cols-4">
              {colorTokens[group].map((token) => (
                <li key={token.name} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`size-12 shrink-0 border border-border ${token.swatch}`}
                  />
                  <span className="flex min-w-0 flex-col">
                    <code lang="en" className="type-ui-sm text-ink">
                      {token.name}
                    </code>
                    <TokenValue name={`--${token.name}`} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="type-ui-sm text-ink-muted">{f.selectionHint}</p>
      </section>

      <section
        aria-labelledby="type"
        className="flex flex-col gap-(--space-section-title-after)"
      >
        <h2 id="type" className="type-section-title text-ink">
          {f.typeTitle}
        </h2>
        <ul className="flex flex-col gap-(--space-module)">
          {typeRoles.map(({ role, kind }) => (
            <li
              key={role}
              className="flex flex-col gap-(--space-list-item) border-t border-border pt-(--space-section-rule-title)"
            >
              <code lang="en" className="type-metadata text-ink-muted">
                {role}
              </code>
              <div className="grid gap-(--space-list-item) md:grid-cols-2">
                {sampleLangs.map(({ code, label }) => (
                  <div key={code} className="flex min-w-0 flex-col gap-1">
                    <span className="type-metadata text-ink-muted">
                      {label}
                    </span>
                    <p lang={code} className={`${role} text-ink`}>
                      {samples[kind][code]}
                    </p>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="format"
        className="flex flex-col gap-(--space-section-title-after)"
      >
        <h2 id="format" className="type-section-title text-ink">
          {f.formatTitle}
        </h2>
        <dl className="grid gap-(--space-list-item) md:grid-cols-2">
          {langs.map((code) => (
            <div key={code} lang={code} className="flex flex-col gap-1">
              <dt className="type-metadata text-ink-muted">
                {sampleLangs.find((s) => s.code === code)?.label}
              </dt>
              <dd className="type-ui text-ink-secondary">
                {formatNumber(SAMPLE_NUMBER, code)} ·{" "}
                {formatDate(SAMPLE_DATE, code)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
