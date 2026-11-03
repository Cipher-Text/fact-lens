import { Shell } from "@/components/layout/Shell";
import { StoryCard } from "@/components/story/StoryCard";
import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";

type Props = {
  story: Story;
  t: Dictionary;
  className?: string;
};

/**
 * The hero of the analysis hub: one lead story across the shell, no rail (tajmin, 2 Nov
 * 2026). The card is the P-2 feature story (C-24 `row-from-md`, 3:2, `feature` split), with
 * the title in type-story-lead as the category page feature story (size lead; tajmin, 4 Nov
 * 2026):
 * one column under 768px, image first; from 768px the text at the start and the image at
 * the end, text : image = 1 : 2 with no image cap (`story-split-lead`; tajmin, 3 Nov 2026).
 * It adds the `category` Eyebrow: inside the /analysis hub the Eyebrow is the category
 * (C-08, DR-417). A hidden h2 names the section; the title is an h3. The image is above the
 * fold, so it loads eagerly (DR-325).
 */
export function AnalysisHeroSection({ story, t, className }: Props) {
  return (
    <Shell
      as="section"
      aria-labelledby="analysis-lead-title"
      data-section="analysis-lead"
      className={className}
    >
      <h2 id="analysis-lead-title" className="sr-only">
        {t.analysisPage.lead}
      </h2>
      <StoryCard
        story={story}
        strings={t}
        layout="row-from-md"
        ratio="3:2"
        size="lead"
        split="feature"
        eyebrowMode="category"
        eager
        className="story-split-lead"
      />
    </Shell>
  );
}
