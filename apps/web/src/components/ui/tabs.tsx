"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

// shadcn Tabs restyled to the RegionSlider chips (C-15, C-11 filter, CPT-16): no indicator,
// no radius, no hover or pressed color (DR-222). The tab is an outline chip, 44px tall, as
// wide as its label; the selected tab has the interactive fill. The focus ring is the base
// outline (COL-13). There is no TabsPanel: the Base UI panel is inert and hidden when not
// selected, but the regions panels are all live columns of the slider row from 600px, so
// RegionSlider writes its own panels.
function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={className} {...props} />
  );
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex gap-2", className)}
      {...props}
    />
  );
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      data-chip="filter"
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center border border-border-interactive px-4 font-ui text-xs font-medium whitespace-nowrap text-ink aria-selected:border-interactive aria-selected:bg-interactive aria-selected:text-on-interactive",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab };
