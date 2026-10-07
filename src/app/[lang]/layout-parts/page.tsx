import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { LanguageSwitch } from "@/components/header/LanguageSwitch";
import { ThemeSwitch } from "@/components/header/ThemeSwitch";
import { AdRow } from "@/components/layout/AdRow";
import { PeerCard, PeerRow } from "@/components/layout/PeerRow";
import { Rail } from "@/components/layout/Rail";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { getDictionary, isLang, type Dictionary } from "@/i18n";

// Temporary page for FL-03: the layout parts at every width. Remove in FL-13.

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/layout-parts">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: getDictionary(lang).layoutParts.title,
    robots: { index: false },
  };
}

function DemoBox({ children }: { children: ReactNode }) {
  return (
    <p className="border border-border bg-surface p-(--grid-column-gap) type-ui text-ink-secondary">
      {children}
    </p>
  );
}

// A sample card with five parts: media, eyebrow, title, summary, meta. Neutral look (U-02).
function SampleCards({ lp }: { lp: Dictionary["layoutParts"] }) {
  return (
    <PeerRow>
      <PeerCard as="article" parts={5}>
        <div aria-hidden className="aspect-video bg-surface-alt" />
        <p className="mt-(--space-story-media-text) type-eyebrow text-ink-muted">
          {lp.cardEyebrow}
        </p>
        <h3 className="mt-(--space-eyebrow-title) type-story-title text-ink">
          {lp.cardTitleLong}
        </h3>
        <p className="mt-(--space-story-title-summary) type-summary text-ink-secondary">
          {lp.cardSummary}
        </p>
        <p className="mt-(--space-story-summary-meta) type-metadata text-ink-muted">
          {lp.cardMeta}
        </p>
      </PeerCard>
      <PeerCard as="article" parts={5}>
        <div aria-hidden className="aspect-video bg-surface-alt" />
        <p className="mt-(--space-story-media-text) type-eyebrow text-ink-muted">
          {lp.cardEyebrow}
        </p>
        <h3 className="mt-(--space-eyebrow-title) type-story-title text-ink">
          {lp.cardTitleShort}
        </h3>
        {/* No summary: its subgrid row stays empty, so the meta lines up (LAY-08). */}
        <p className="row-start-5 mt-(--space-story-summary-meta) type-metadata text-ink-muted">
          {lp.cardMeta}
        </p>
      </PeerCard>
    </PeerRow>
  );
}

export default async function LayoutPartsPage({
  params,
}: PageProps<"/[lang]/layout-parts">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDictionary(lang);
  const lp = t.layoutParts;

  return (
    <main>
      <AdRow slot="ad-band-top" strings={t.ads} />

      <Shell
        as="header"
        className="flex flex-col gap-(--space-story-title-meta) pt-(--space-page-start) pb-(--space-module)"
      >
        <div className="flex flex-wrap items-center gap-4">
          <LanguageSwitch lang={lang} path="/layout-parts" />
          <ThemeSwitch strings={t.theme} />
        </div>
        <h1 className="type-page-title text-ink">{lp.title}</h1>
        <p className="type-ui text-ink-secondary">{lp.note}</p>
      </Shell>

      <Shell
        as="section"
        aria-labelledby="with-rail"
        className="pb-(--space-module)"
        data-testid="shell"
      >
        <SectionHeading id="with-rail">{lp.withRailTitle}</SectionHeading>
        <WithRail>
          <Wrapper
            className="flex flex-col gap-(--space-module)"
            data-testid="wrapper"
          >
            <DemoBox>{lp.wrapper}</DemoBox>
            <SampleCards lp={lp} />
            <AdRow slot="ad-inset" strings={t.ads} />
            <SampleCards lp={lp} />
          </Wrapper>
          <Rail data-testid="rail">
            <DemoBox>{lp.rail}</DemoBox>
          </Rail>
        </WithRail>
      </Shell>

      <AdRow slot="ad-band" strings={t.ads} />

      <Shell
        as="section"
        aria-labelledby="no-rail"
        className="py-(--space-module)"
        data-testid="shell-no-rail"
      >
        <SectionHeading id="no-rail">{lp.noRailTitle}</SectionHeading>
        <Wrapper data-testid="wrapper-full">
          <DemoBox>{lp.wrapperFull}</DemoBox>
        </Wrapper>
      </Shell>
    </main>
  );
}
