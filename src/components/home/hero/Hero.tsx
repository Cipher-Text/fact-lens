import { PeerRow } from "@/components/layout/PeerRow";
import { Rail } from "@/components/layout/Rail";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { StoryCard } from "@/components/story/StoryCard";
import type { HeroSection, Lang } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { LatestList } from "./LatestList";
import { LeadStory } from "./LeadStory";

type HeroProps = {
  lang: Lang;
  hero: HeroSection;
  t: Dictionary;
  className?: string;
};

/**
 * P-1 Hero (spacing-layout-system.md 7.2 to 7.4, DR-39). Wrapper: the lead, then the
 * top stories as a peer pair (DR-44). Rail: Latest. From 1024px the rail is 304px beside
 * the wrapper; below, it goes under it (LAY-05). Sparse (7.3): one top story spans the
 * wrapper; with no Latest items the wrapper spans the shell.
 */
export function Hero({ lang, hero, t, className }: HeroProps) {
  // Two top-story cards at most (DR-44).
  const top = hero.top.slice(0, 2);

  const wrapper = (
    <Wrapper data-hero-wrapper className="flex flex-col gap-y-(--grid-row-gap)">
      <LeadStory story={hero.lead} strings={t} />
      {top.length > 0 ? (
        <PeerRow
          data-top-stories
          className={cn(top.length === 1 && "sm:grid-cols-1")}
        >
          {top.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              strings={t}
              titleClass="type-story-title-lg"
              eager
            />
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
            <LatestList lang={lang} stories={hero.latest} strings={t} />
          </Rail>
        </WithRail>
      ) : (
        wrapper
      )}
    </Shell>
  );
}
