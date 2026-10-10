import { cn } from "@/lib/utils";

/**
 * Item divider (C-22, Draft): a 1px border-color rule with space-list-item on each side,
 * between list rows only. No rule after the last row, and no hr between list items:
 * lists keep their ul/li semantics. Put it on the li (DR-102).
 */
export const dividerItem =
  "mt-(--space-list-item) border-t border-border pt-(--space-list-item) first:mt-0 first:border-t-0 first:pt-0";

type DividerProps = {
  /** Only the section variant is approved. Item is the class above; column is postponed (DR-104). */
  variant?: "section";
  className?: string;
};

/**
 * Divider.section (C-22): a 1px border rule with the bar on it at the start. The bar and
 * the rule share the bottom edge. Bar size is --bar-section, color is --color-bar (brand in
 * light, interactive in dark). Decorative, so it is aria-hidden.
 */
export function Divider({ className }: DividerProps) {
  return (
    <div
      aria-hidden="true"
      data-divider="section"
      className={cn(
        "relative h-(--bar-section-height) w-full shrink-0",
        className,
      )}
    >
      <span className="absolute inset-x-0 bottom-0 h-px bg-border" />
      <span
        data-divider-bar
        className="absolute start-0 bottom-0 h-full w-(--bar-section-width) bg-(--color-bar)"
      />
    </div>
  );
}
