import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ShellTag = "div" | "section" | "header" | "footer" | "main" | "nav";

type ShellProps = HTMLAttributes<HTMLElement> & { as?: ShellTag };

/**
 * The editorial container: min(100% − 2 × gutter, 80rem), centered.
 * Every homepage section uses it (LAY-03). spacing-layout-system.md Sections 2 and 3.2.
 */
export function Shell({ as: Tag = "div", className, ...props }: ShellProps) {
  return <Tag className={cn("shell", className)} {...props} />;
}
