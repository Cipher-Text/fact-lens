import { cn } from "@/lib/utils";

/**
 * Divider.item (C-22, DR-262): a 1px dotted rule in the border color, with space-list-item on
 * each side, between list rows only. No rule before the first row or after the last, and no
 * hr between list items: lists keep their ul/li semantics. Put it on the li (DR-102).
 * The dots come from the `divider-item` utility in components.css (a repeating gradient, so
 * every browser draws the same dots).
 */
export const dividerItem = "divider-item";

/** Divider.item for the items of a multi-column grid list: the rule runs within a column only. */
export const dividerItemGrid = "divider-item-grid";

type DividerProps = {
  /** Only the section variant is built. Item is the class above. Column (column-inset, column-full) waits for tajmin to place it (DR-262). */
  variant?: "section";
  className?: string;
};

/**
 * Divider.section (C-22): a 2px solid border rule with the bar on it at the start. The bar and
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
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border" />
      <span
        data-divider-bar
        className="absolute start-0 bottom-0 h-full w-(--bar-section-width) bg-(--color-bar)"
      />
    </div>
  );
}
