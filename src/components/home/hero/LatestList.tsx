import { SectionHeading } from "@/components/layout/SectionHeading";
import { StoryList } from "@/components/story/StoryList";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

type LatestListProps = {
  stories: Story[];
  strings: Pick<Dictionary, "hero" | "story" | "categories">;
};

/**
 * HeroSection.latest: the SectionHeading (h2) and a StoryList (C-03) with category and time.
 * No "আরও দেখুন" link (DR-102). One column on phones and in the rail from 1024px; two columns,
 * column-first, from 768 to 1023px.
 */
export function LatestList({ stories, strings }: LatestListProps) {
  return (
    <section aria-labelledby="latest-title" data-latest>
      <SectionHeading as="h2" id="latest-title">
        {strings.hero.latest}
      </SectionHeading>
      <StoryList
        stories={stories}
        strings={strings}
        columns={2}
        meta="category-time"
      />
    </section>
  );
}
