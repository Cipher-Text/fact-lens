import { notFound } from "next/navigation";

import { PeerRow } from "@/components/layout/PeerRow";
import { Rail } from "@/components/layout/Rail";
import { Shell } from "@/components/layout/Shell";
import { WithRail } from "@/components/layout/WithRail";
import { Wrapper } from "@/components/layout/Wrapper";
import { LeadStory } from "@/components/story/LeadStory";
import { OverlapCard } from "@/components/story/OverlapCard";
import { StoryCard } from "@/components/story/StoryCard";
import { StoryList } from "@/components/story/StoryList";
import { getHomepage, getStory } from "@/content";
import { getDictionary, isLang } from "@/i18n";

// Test page for the story units (R2-07): each unit with the full, the long-headline and the
// no-image content of the mock set, at wrapper width and in the 304px rail. Development only:
// the production build answers 404. The Playwright tests in tests/e2e/story-units.spec.ts use it.
export default async function StoryUnitsPage({
  params,
}: PageProps<"/[lang]/dev/story-units">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDictionary(lang);

  const full = getStory("river-data-framework", lang);
  const longWithImage = getStory("deep-sea-port-trial-ship", lang);
  const longNoImage = getStory("royal-family-genealogy", lang);
  const noImage = getStory("joint-border-patrol-rules", lang);
  const latest = getHomepage(lang).hero!.latest.slice(0, 5);

  return (
    <main id="main" className="py-(--space-module)">
      <Shell as="section" data-unit="lead-story">
        <LeadStory story={full} strings={t} />
      </Shell>
      <Shell
        as="section"
        data-unit="lead-story-long"
        className="mt-(--space-module)"
      >
        <LeadStory story={longWithImage} strings={t} />
      </Shell>
      <Shell
        as="section"
        data-unit="lead-story-no-image"
        className="mt-(--space-module)"
      >
        <LeadStory story={longNoImage} strings={t} />
      </Shell>
      <Shell
        as="section"
        data-unit="overlap-card"
        className="mt-(--space-module)"
      >
        <PeerRow className="items-start">
          <OverlapCard story={longWithImage} strings={t} />
          <OverlapCard story={noImage} strings={t} />
        </PeerRow>
      </Shell>
      <Shell
        as="section"
        data-unit="story-card"
        className="mt-(--space-module)"
      >
        <WithRail>
          <Wrapper className="flex flex-col gap-y-(--space-module)">
            <div data-case="feature">
              <StoryCard
                story={longWithImage}
                strings={t}
                eyebrow={false}
                variant="side"
              />
            </div>
            <div data-case="row">
              <StoryCard
                story={longWithImage}
                strings={t}
                summary={false}
                variant="thumbnail"
              />
            </div>
            <div data-case="no-image">
              <StoryCard story={longNoImage} strings={t} variant="thumbnail" />
            </div>
          </Wrapper>
          <Rail>
            <div data-case="rail">
              <StoryCard
                story={longWithImage}
                strings={t}
                summary={false}
                variant="top"
              />
            </div>
          </Rail>
        </WithRail>
      </Shell>
      <Shell
        as="section"
        data-unit="story-list"
        className="mt-(--space-module)"
      >
        <StoryList
          stories={latest}
          strings={t}
          columns={2}
          meta="category-time"
        />
      </Shell>
    </main>
  );
}
