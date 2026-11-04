import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Divider } from "./Divider";

type SectionHeadingProps = {
  /** Use this id in aria-labelledby on the section. */
  id?: string;
  /** One h2 per section; h3 for a group heading inside a section. */
  as?: "h2" | "h3";
  className?: string;
  /** Controls at the end edge, for example the slider buttons (C-15). Never a "more" link (CPT-14). */
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * C-13 SectionHeading: Divider.section, space-section-rule-title, the title as plain text
 * (never a link, CPT-13), then space-section-title-after to the first content. With
 * actions the row is at least 44px high, the title centered on the actions.
 */
export function SectionHeading({
  id,
  as: Tag = "h2",
  className,
  actions,
  children,
}: SectionHeadingProps) {
  const title = (
    <Tag
      id={id}
      data-section-title
      className="min-w-0 font-editorial text-section font-semibold text-ink"
    >
      {children}
    </Tag>
  );
  return (
    <div className={cn("mb-(--space-section-title-after)", className)}>
      <Divider />
      <div className="mt-(--space-section-rule-title)">
        {actions ? (
          <div className="flex min-h-11 items-center justify-between gap-x-(--grid-column-gap)">
            {title}
            {actions}
          </div>
        ) : (
          title
        )}
      </div>
    </div>
  );
}
