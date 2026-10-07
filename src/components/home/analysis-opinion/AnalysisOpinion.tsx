import { SectionHeading } from "@/components/layout/SectionHeading";
import { Shell } from "@/components/layout/Shell";
import type { AnalysisOpinionSection, Lang } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

import { AnalysisList } from "./AnalysisList";
import { OpinionList } from "./OpinionList";

type AnalysisOpinionProps = {
  lang: Lang;
  section: AnalysisOpinionSection;
  t: Dictionary;
  className?: string;
};

/**
 * P-4 বিশ্লেষণ ও মতামত (spacing-layout-system.md 7.2 to 7.4, DR-52, DR-76). Shell width,
 * not a full-width row; the surface-elevated background is inside the shell only. Two
 * equal columns from 768px, analysis first (left), opinion second; stacked below 768px.
 * No rail. Both columns align to the top and end where their content ends. Sparse (7.3):
 * when one column is empty, the other spans the shell.
 * The padding inside the background is not in the specs (UNRESOLVED_DESIGN_SYSTEM U-17):
 * space-module on every side.
 */
export function AnalysisOpinion({
  lang,
  section,
  t,
  className,
}: AnalysisOpinionProps) {
  const { analysis, opinion } = section;
  const both = analysis.length > 0 && opinion.length > 0;
  return (
    <Shell
      as="section"
      aria-labelledby="analysis-opinion-title"
      data-section="analysis-opinion"
      className={cn("bg-surface-elevated p-(--space-module)", className)}
    >
      <SectionHeading id="analysis-opinion-title">
        {t.analysisOpinion.title}
      </SectionHeading>
      <div
        data-columns
        className={cn(
          "grid grid-cols-1 items-start gap-x-(--grid-column-gap) gap-y-(--space-module)",
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
  );
}
