import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Use this id in aria-labelledby on the section. */
  id?: string;
  as?: "h2" | "h3";
  className?: string;
  /** Controls at the end of the row, for example the P-3b slider buttons. Never a "more" link (LAY-18). */
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * The section heading row: an editorial rule, space-section-rule-title, the heading,
 * then space-section-title-after to the first content. The "আরও দেখুন" link never goes
 * in this row (LAY-18). Rule color: brand for editorial rules (COL-04).
 * The rule thickness is not in the specs (UNRESOLVED_DESIGN_SYSTEM U-06): 1px border.
 */
export function SectionHeading({
  id,
  as: Tag = "h2",
  className,
  actions,
  children,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-(--space-section-title-after) border-t border-brand pt-(--space-section-rule-title)",
        actions && "flex items-center justify-between gap-x-(--grid-column-gap)",
        className,
      )}
    >
      <Tag id={id} className="min-w-0 type-section-title text-ink">
        {children}
      </Tag>
      {actions}
    </div>
  );
}
