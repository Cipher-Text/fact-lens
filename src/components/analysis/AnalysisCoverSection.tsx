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
 * The cover of the analysis hub (N-06): one cover story across the shell, no rail (tajmin,
 * 2 Nov 2026). The card is StoryCard `side` with `large` (C-24, DR-451): the cover title
 * (text-4xl), one column under 768px, image first; from 768px the text at the start and the
 * 3:2 image at the end, 2 / 3 of the card width, no minimum and no maximum (DR-464).
 * It adds the `category` Eyebrow: inside the /analysis hub the Eyebrow is the category
 * (C-08, DR-417). A hidden h2 names the section; the title is an h3. The image is above the
 * fold, so it loads eagerly (DR-325).
 */
export function AnalysisCoverSection({ story, t, className }: Props) {
  return (
    <Shell
      as="section"
      aria-labelledby="analysis-cover-title"
      data-section="analysis-cover"
      className={className}
    >
      <h2 id="analysis-cover-title" className="sr-only">
        {t.analysisPage.cover}
      </h2>
      <StoryCard
        story={story}
        strings={t}
        variant="side"
        large
        eyebrowMode="category"
        eager
      />
    </Shell>
  );
}
