import { PeerRow } from "@/components/layout/PeerRow";
import { Rail } from "@/components/layout/Rail";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { LeadStory } from "@/components/story/LeadStory";
import { MoreLink } from "@/components/story/MoreLink";
import { OverlapCard } from "@/components/story/OverlapCard";
import { StoryList } from "@/components/story/StoryList";
import type { HeroContent, Lang } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type HeroSectionProps = {
  lang: Lang;
  hero: HeroContent;
  t: Dictionary;
  className?: string;
};

/**
 * P-1 HeroSection (spacing-layout-system.md 7.2 to 7.4, DR-39). Wrapper: the lead, then the
 * top stories as a peer pair (DR-44). Rail: Latest. From 1024px the rail is 304px beside
 * the wrapper; below, it goes under it (LAY-05). Sparse (7.3): one top story spans the
 * wrapper; with no Latest items the wrapper spans the shell.
 */
export function HeroSection({ lang, hero, t, className }: HeroSectionProps) {
  // Two top-story cards at most (DR-44).
  const top = hero.top.slice(0, 2);

  const wrapper = (
    <Wrapper data-hero-wrapper className="flex flex-col gap-y-(--grid-row-gap)">
      <LeadStory story={hero.lead} strings={t} />
      {top.length > 0 ? (
        <PeerRow
          data-top-stories
          className={cn("items-start", top.length === 1 && "sm:grid-cols-1")}
        >
          {top.map((story) => (
            <OverlapCard key={story.id} story={story} strings={t} eager />
          ))}
        </PeerRow>
      ) : null}
    </Wrapper>
  );

  return (
    <Shell
      as="section"
      aria-labelledby="hero-title"
      data-section="hero"
      className={className}
    >
      <h2 id="hero-title" className="sr-only">
        {t.hero.title}
      </h2>
      {hero.latest.length > 0 ? (
        <WithRail>
          {wrapper}
          <Rail data-hero-rail>
            {/* HeroSection.latest: SectionHeading and StoryList (C-03), category and time,
                then one MoreLink to the Latest page at the end edge (DR-350, amends DR-102).
                The Latest page is M2: the link goes to 404 until then. */}
            <section aria-labelledby="latest-title" data-latest>
              <SectionHeading as="h2" id="latest-title">
                {t.hero.latest}
              </SectionHeading>
              <StoryList
                stories={hero.latest.slice(0, 5)}
                strings={t}
                columns={2}
                meta="category-time"
              />
              <MoreLink
                href={localizedPath(lang, "/latest")}
                section={t.hero.latest}
                strings={t.common}
              />
            </section>
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
    </Shell>
  );
}
