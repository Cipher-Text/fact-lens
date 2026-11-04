"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

// shadcn RadioGroup restyled to the DailyPoll sheet (C-26, CPT-16): the whole row is the
// tap target, the marker is a square (no radius), the selected marker holds a smaller
// interactive square (not a full fill). The focus ring is the base outline (COL-13).
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex w-full flex-col gap-1", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  children,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "flex min-h-12 w-full cursor-pointer items-center gap-3 text-start font-ui text-sm font-medium text-ink",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="radio-group-marker"
        className="flex size-5 shrink-0 items-center justify-center border-2 border-interactive p-0.5"
      >
        <RadioPrimitive.Indicator className="block size-3 bg-interactive" />
      </span>
      <span className="min-w-0">{children}</span>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
