import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import type { AnalysisOpinionSection, Lang } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { AnalysisList } from "./AnalysisList";
import { OpinionList } from "./OpinionList";

type AnalysisSectionProps = {
  lang: Lang;
  section: AnalysisOpinionSection;
  t: Dictionary;
  className?: string;
};

/**
 * P-4 বিশ্লেষণ ও মতামত (spacing-layout-system.md 7.2 to 7.4, DR-52, DR-76). A panel band
 * (5.3, DR-264): the surface-elevated background spans the full viewport width and the
 * content sits in the shell, so it aligns with the page gutter. Two
 * equal columns from 768px, analysis first (left), opinion second; stacked below 768px.
 * No rail. Both columns align to the top and end where their content ends. Sparse (7.3):
 * when one column is empty, the other spans the shell.
 * A panel band takes the block values of the panel inset only, 40px under 600px and 48px
 * from 600px, and no inline inset (LAY-20, DR-224, DR-264). Space before and after the
 * section is margin outside the background, set by the page (LAY-12, DR-205).
 */
export function AnalysisSection({
  lang,
  section,
  t,
  className,
}: AnalysisSectionProps) {
  const { analysis, opinion } = section;
  const both = analysis.length > 0 && opinion.length > 0;
  return (
    <section
      aria-labelledby="analysis-opinion-title"
      data-section="analysis-opinion"
      className={cn("bg-surface-elevated py-10 sm:py-12", className)}
    >
      <Shell>
        <SectionHeading id="analysis-opinion-title">
          {t.analysisOpinion.title}
        </SectionHeading>
        <div
          data-columns
          className={cn(
            "grid grid-cols-1 items-start gap-x-(--grid-column-gap) gap-y-(--grid-row-gap)",
            both && "md:grid-cols-2",
          )}
        >
          {analysis.length > 0 ? (
            <AnalysisList lang={lang} stories={analysis} strings={t} />
          ) : null}
          {opinion.length > 0 ? (
            <OpinionList lang={lang} stories={opinion} strings={t} />
          ) : null}
        </div>
      </Shell>
    </section>
  );
}
