import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type RailTag = "div" | "aside";

type RailProps = HTMLAttributes<HTMLElement> & { as?: RailTag };

/**
 * The supporting column of a section. WithRail gives it measure-rail (304px) from 1024px.
 * Below 1024px it is full width under the wrapper. Its source order is after the wrapper (LAY-14).
 */
export function Rail({ as: Tag = "div", className, ...props }: RailProps) {
  return <Tag className={cn("min-w-0", className)} {...props} />;
}
