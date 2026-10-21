import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type WithRailProps = ComponentPropsWithoutRef<"div">;

/**
 * The wrapper + rail grid inside the shell. Put a Wrapper and then a Rail in it.
 * From 1024px the rail is 304px beside the wrapper; below 1024px it goes under it (LAY-05).
 * When a section has no rail content, use a Wrapper without WithRail, so it spans the shell
 * (spacing-layout-system.md Section 7.3).
 */
export function WithRail({ className, ...props }: WithRailProps) {
  return <div className={cn("with-rail", className)} {...props} />;
}
