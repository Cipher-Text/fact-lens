import type { Story } from "@/content";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type StoryEyebrowProps = {
  story: Story;
  strings: Pick<Dictionary, "story" | "categories">;
  className?: string;
};

/**
 * The label above a headline. A breaking story shows the filled Breaking label (COL-11);
 * other stories show their category. Category pages do not exist yet, so the label is
 * not a link and uses ink-muted (typography-system.md 7.1).
 */
export function StoryEyebrow({ story, strings, className }: StoryEyebrowProps) {
  if (story.breaking) {
    return (
      <p className={cn("type-eyebrow", className)}>
        <BreakingLabel text={strings.story.breaking} />
      </p>
    );
  }
  return (
    <p className={cn("type-eyebrow text-ink-muted", className)}>
      {strings.categories[story.category]}
    </p>
  );
}

/** The filled Breaking label: bg-live with the word, never live as plain text (COL-11). */
export function BreakingLabel({ text }: { text: string }) {
  return <span className="inline-block bg-live px-1 text-on-live">{text}</span>;
}
