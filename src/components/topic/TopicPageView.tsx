import { AdSlot } from "@/components/ads/AdSlot";
import { Footer } from "@/components/footer/Footer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { SkipLink } from "@/components/header/SkipLink";
import { PageTitle } from "@/components/layout/PageTitle";
import { MoreStoriesSection } from "@/components/more-stories/MoreStoriesSection";
import type { TopicPage } from "@/content";
import { getDictionary } from "@/i18n";

type Props = {
  page: TopicPage;
};

/**
 * The topic page (layout 7C.2 Paths, Topic row; DR-410): the news and analysis of one topic,
 * newest first, no opinion. Page order as the Latest page (layout 7D): header, ad-top,
 * PageTitle, the list, footer. No ad band (tajmin, 29 Oct 2026).
 */
export function TopicPageView({ page }: Props) {
  const { lang, topic } = page;
  const t = getDictionary(lang);

  return (
    <>
      <SkipLink label={t.header.skipLink} />
      <SiteHeader lang={lang} path={`/topic/${topic.slug}`} />
      {/* The top ad row is below the header, full width (DR-295). */}
      <AdSlot variant="top" lang={lang} strings={t.ads} />
      {/* tabIndex -1: the SkipLink target takes focus in every browser (DR-269). */}
      <main
        id="main"
        tabIndex={-1}
        className="pb-(--space-section) focus-visible:outline-none"
      >
        {/* The topic name is the h1, with no label (tajmin, 30 Oct 2026). */}
        <PageTitle
          id="topic-title"
          title={topic.label}
          className="mb-(--space-module)"
        />
        {/* The list of the Latest page, reused: the h1 names it; 10 first, then 10 per press.
            The Eyebrow: category on news, format on analysis (tajmin, 30 Oct 2026). With no
            news or analysis the section is not shown (7.3). */}
        {page.stories.length > 0 ? (
          <MoreStoriesSection
            stories={page.stories}
            labelledBy="topic-title"
            section="topic"
            eyebrow
            eyebrowMode="format"
            t={t}
          />
        ) : null}
      </main>
      <Footer lang={lang} />
    </>
  );
}
