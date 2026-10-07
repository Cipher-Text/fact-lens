import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type WrapperProps = ComponentPropsWithoutRef<"div">;

/** The fluid main column of a section. It takes the width that the rail leaves. */
export function Wrapper({ className, ...props }: WrapperProps) {
  return <div className={cn("min-w-0", className)} {...props} />;
}
