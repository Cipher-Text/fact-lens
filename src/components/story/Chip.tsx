import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type LabelChipProps = {
  /** label: the Opinion chip, not a link. live: the Breaking or Live label in the eyebrow slot (COL-11). */
  variant: "label" | "live";
  children: ReactNode;
  className?: string;
};

type FilterChipProps = ComponentProps<"button"> & { variant: "filter" };

/**
 * C-11 Chip. Square (CPT-05).
 * label and live are text, not controls: type-eyebrow on a fill, padding 2px 8px.
 * filter is a button for the region tabs on phones: 44px tall, 16px side padding, type-ui-sm,
 * a 1px interactive outline, ink text; aria-selected fills it with interactive. It has no hover
 * color and no pressed color (DR-222). The caller sets role="tab" and aria-selected.
 */
export function Chip(props: LabelChipProps | FilterChipProps) {
  if (props.variant === "filter") {
    const { variant, className, type = "button", ...rest } = props;
    return (
      <button
        type={type}
        data-chip={variant}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center border border-border-interactive px-4 type-ui-sm whitespace-nowrap text-ink aria-selected:border-interactive aria-selected:bg-interactive aria-selected:text-on-interactive",
          className,
        )}
        {...rest}
      />
    );
  }
  const { variant, className, children } = props;
  return (
    <span
      data-chip={variant}
      className={cn(
        "inline-block px-2 py-0.5 type-eyebrow",
        variant === "live"
          ? "bg-live text-on-live"
          : "bg-(--color-bar) text-on-interactive",
        className,
      )}
    >
      {children}
    </span>
  );
}
