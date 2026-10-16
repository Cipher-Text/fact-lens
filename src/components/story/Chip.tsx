import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChipProps = {
  /** label: the Opinion chip, not a link. There is no live variant (COL-11, DR-279). */
  variant: "label";
  children: ReactNode;
  className?: string;
};

/**
 * C-11 Chip. Square (CPT-05).
 * label is text, not a control: type-eyebrow on a fill, padding 2px 8px.
 * The filter variant (region tabs on phones) is the shadcn Tabs tab in ui/tabs.tsx (CPT-16).
 */
export function Chip({ variant, className, children }: ChipProps) {
  return (
    <span
      data-chip={variant}
      className={cn(
        "inline-block px-2 py-0.5 type-eyebrow",
        "bg-(--color-bar) text-on-interactive",
        className,
      )}
    >
      {children}
    </span>
  );
}
