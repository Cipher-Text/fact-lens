import { cn } from "@/lib/utils";

/**
 * Divider.item (C-22, DR-262, DR-350): a 1px dotted rule in the border color (1px dots, 2px
 * gap), with space-list-item on each side measured to the text ink, between list rows only.
 * No rule before the first row or after the last, and no hr between list items: lists keep
 * their ul/li semantics. Put it on the li (DR-102), and one listInk class on the list.
 * The dots come from the `divider-item` utility in components.css (a repeating gradient, so
 * every browser draws the same dots).
 */
export const dividerItem = "divider-item";

/**
 * The ink trim of a list (DR-350), by what starts and ends its items: a title and a meta
 * line (StoryListItem, OpinionList, a StoryList after a card), or an image and a meta line
 * (the AnalysisSection rows).
 */
export const listInk = {
  titleMeta: "list-ink-title-meta",
  mediaMeta: "list-ink-media-meta",
} as const;

/**
 * Divider.column-inset (C-22, DR-351): a 1px solid vertical rule in the middle of the column
 * gap, 16px from the top and the bottom. Put it on the grid; the gap does not change.
 * split: two equal columns, from 768 (P-4). rail: the wrapper and the rail, from 1024 (P-3).
 * columns: the two CSS columns of the Latest list, 768 to 1023 (C-03, DR-355).
 * column-full is not used on the homepage.
 */
export const dividerColumn = {
  split: "divider-column-split",
  rail: "divider-column-rail",
  columns: "divider-column-columns",
} as const;

type DividerProps = {
  /** section and rule are components. Item and column are the classes above. */
  variant?: "section" | "rule";
  className?: string;
};

/**
 * Divider.section (C-22): a 2px solid border rule with the bar on it at the start. The bar and
 * the rule share the bottom edge. Bar size is --bar-section, color is --color-bar (brand in
 * light, interactive in dark). Decorative, so it is aria-hidden.
 */
export function Divider({ variant = "section", className }: DividerProps) {
  // Divider.rule (C-22, tajmin 27 Oct 2026): a 1px solid horizontal rule in the border color,
  // the full width of its container. The shared part wherever one plain rule separates two
  // modules; the space around it belongs to the caller.
  if (variant === "rule") {
    return (
      <div
        aria-hidden="true"
        data-divider="rule"
        className={cn(
          "h-(--divider-rule) w-full shrink-0 bg-border",
          className,
        )}
      />
    );
  }
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
