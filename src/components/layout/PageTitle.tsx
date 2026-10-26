import { Shell } from "@/components/layout/Shell";

type Props = {
  title: string;
  className?: string;
};

/**
 * PageTitle: the title of a page that is not the homepage or an article, as the page h1,
 * type-page-title, in the shell, with a short brand bar above it. No description. The
 * category page uses it with the category name (spacing-layout-system.md 7B). Sheet: C-43.
 */
export function PageTitle({ title, className }: Props) {
  return (
    <Shell as="header" className={className}>
      {/* A short brand bar above the title, at the start edge: the bar of Divider.section
          (--bar-section-width, --bar-section-height) without its rule (tajmin's tweak at
          checkpoint 2). */}
      <div
        aria-hidden="true"
        data-title-bar
        className="mb-4 h-(--bar-section-height) w-(--bar-section-width) bg-(--color-bar)"
      />
      <h1 className="type-page-title text-ink">{title}</h1>
    </Shell>
  );
}
