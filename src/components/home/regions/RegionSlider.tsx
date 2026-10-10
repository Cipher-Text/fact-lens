"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { railModule } from "@/components/home/grouped/classes";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Chip } from "@/components/story/Chip";
import { IconButton } from "@/components/story/IconButton";
import type { Dictionary } from "@/i18n";
import {
  easeOut,
  nextTabIndex,
  sliderEdges,
  sliderTarget,
  type SliderEdges,
} from "@/lib/slider";
import { cn } from "@/lib/utils";

export type RegionPanel = {
  id: string;
  label: string;
  /** The region's stories, rendered on the server. */
  content: ReactNode;
};

type RegionSliderProps = {
  title: string;
  regions: RegionPanel[];
  strings: Dictionary["regionSlider"];
};

// 7.4: 200–300ms. Motion has no token yet (UNRESOLVED_DESIGN_SYSTEM U-02).
const SCROLL_MS = 250;
// 7.3 and 7.4: with 4 regions or fewer there are no buttons.
const MIN_REGIONS_FOR_BUTTONS = 5;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * P-3b Regions (spacing-layout-system.md 7.2 to 7.4, DR-54).
 * From 600px: one row of region columns in a scroll-snap container, 2 in view, 4 from
 * 1024px. The previous and next buttons move one column (width + gap) in 250ms, or at
 * once with reduced motion, and are disabled at each end. No loop, no autoplay. Swipe is
 * native scrolling. All regions are in the HTML, so the keyboard reaches every link.
 * Below 600px: region chips as tabs (tablist, arrow keys, aria-selected). One panel shows.
 * The tab mode follows the CSS: it is on while the tablist is displayed, so the JS has no
 * breakpoint of its own.
 * Each panel is #region-<id>, the anchor of the region links in the nav and drawer (IMP-14).
 */
export function RegionSlider({ title, regions, strings }: RegionSliderProps) {
  const [selected, setSelected] = useState(0);
  const [tabMode, setTabMode] = useState(true);
  const [edges, setEdges] = useState<SliderEdges>({
    atStart: true,
    atEnd: false,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const animation = useRef<{ frame: number; target: number } | null>(null);
  const showButtons = regions.length >= MIN_REGIONS_FOR_BUTTONS;

  const updateEdges = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const next = sliderEdges(row.scrollLeft, row.scrollWidth - row.clientWidth);
    setEdges((prev) =>
      prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
    );
  }, []);

  // Tab mode and the button states follow the width.
  useEffect(() => {
    const root = rootRef.current;
    const tablist = tablistRef.current;
    if (!root || !tablist) return;
    const update = () => {
      setTabMode(getComputedStyle(tablist).display !== "none");
      updateEdges();
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, [updateEdges]);

  // A nav or drawer link to #region-<id> selects that region's tab.
  useEffect(() => {
    const selectFromHash = () => {
      const index = regions.findIndex(
        (region) => `#region-${region.id}` === window.location.hash,
      );
      if (index < 0) return;
      setSelected(index);
      // The panel was hidden when the browser jumped to it. Jump again once it shows.
      requestAnimationFrame(() =>
        document
          .getElementById(`region-${regions[index].id}`)
          ?.scrollIntoView(),
      );
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [regions]);

  useEffect(
    () => () => {
      if (animation.current) cancelAnimationFrame(animation.current.frame);
    },
    [],
  );

  const move = (direction: -1 | 1) => {
    const row = rowRef.current;
    const first = row?.firstElementChild;
    if (!row || !(first instanceof HTMLElement)) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    // A second press during the animation moves on from the current target.
    const from = animation.current?.target ?? row.scrollLeft;
    const target = sliderTarget(
      from,
      step,
      row.scrollWidth - row.clientWidth,
      direction,
    );
    if (animation.current) cancelAnimationFrame(animation.current.frame);
    animation.current = null;

    if (prefersReducedMotion()) {
      row.scrollLeft = target;
      return;
    }
    // Snap would pull each frame back to a column, so it is off while the row moves.
    row.style.scrollSnapType = "none";
    const start = row.scrollLeft;
    const startTime = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - startTime) / SCROLL_MS, 1);
      row.scrollLeft = start + (target - start) * easeOut(t);
      if (t < 1) {
        animation.current = { frame: requestAnimationFrame(frame), target };
      } else {
        animation.current = null;
        row.style.scrollSnapType = "";
      }
    };
    animation.current = { frame: requestAnimationFrame(frame), target };
  };

  const select = (index: number) => {
    setSelected(index);
    const tab = tabRefs.current[index];
    tab?.focus();
    tab?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = nextTabIndex(selected, event.key, regions.length);
    if (index === null) return;
    event.preventDefault();
    select(index);
  };

  const buttons = showButtons ? (
    <div className="hidden shrink-0 gap-2 sm:flex">
      <IconButton
        icon={ChevronLeft}
        label={strings.previous}
        aria-controls="regions-row"
        aria-disabled={edges.atStart || undefined}
        onClick={() => !edges.atStart && move(-1)}
        data-region-previous
      />
      <IconButton
        icon={ChevronRight}
        label={strings.next}
        aria-controls="regions-row"
        aria-disabled={edges.atEnd || undefined}
        onClick={() => !edges.atEnd && move(1)}
        data-region-next
      />
    </div>
  ) : null;

  return (
    <div ref={rootRef}>
      <SectionHeading id="regions-title" actions={buttons}>
        {title}
      </SectionHeading>
      {/* Phone tabs. -mx-1 with p-1 leaves room for the focus ring inside the scroll box;
          the chips stay in line with the shell. */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-labelledby="regions-title"
        onKeyDown={onTabKeyDown}
        className="-mx-1 mb-(--space-section-title-after) flex gap-2 overflow-x-auto p-1 sm:hidden"
      >
        {regions.map((region, index) => (
          <Chip
            variant="filter"
            key={region.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            role="tab"
            id={`region-${region.id}-tab`}
            aria-selected={index === selected}
            aria-controls={`region-${region.id}`}
            tabIndex={index === selected ? 0 : -1}
            onClick={() => select(index)}
            data-region-tab={region.id}
          >
            {region.label}
          </Chip>
        ))}
      </div>
      {/* From 600: the slider row. Column width = (row − gaps) / regions in view, from
          the column gap token; 12.3 has no slider CSS (DOC-20). -m-1 with p-1 and
          scroll-p-1 leave room for the focus ring, and the columns stay in line with
          the shell. Below 600 only the selected panel shows. */}
      <div
        ref={rowRef}
        id="regions-row"
        onScroll={updateEdges}
        className="grid auto-cols-fr grid-flow-col gap-x-(--grid-column-gap) sm:-m-1 sm:snap-x sm:snap-mandatory sm:scroll-p-1 sm:auto-cols-[calc((100%-var(--grid-column-gap))/2)] sm:overflow-x-auto sm:p-1 lg:auto-cols-[calc((100%-3*var(--grid-column-gap))/4)]"
        data-region-row
      >
        {regions.map((region, index) => (
          <div
            key={region.id}
            id={`region-${region.id}`}
            role={tabMode ? "tabpanel" : "group"}
            aria-labelledby={
              tabMode ? `region-${region.id}-tab` : `region-${region.id}-title`
            }
            className={cn(
              "min-w-0 sm:snap-start",
              index !== selected && "max-sm:hidden",
            )}
            data-region={region.id}
          >
            {/* The chip names the panel on phones, so the heading is for screen
                readers there. Same role as the chip (type-ui-sm), U-28. */}
            <h3
              id={`region-${region.id}-title`}
              className={cn(
                railModule,
                "mb-(--space-list-item) type-ui-sm text-ink max-sm:sr-only",
              )}
            >
              {region.label}
            </h3>
            {region.content}
          </div>
        ))}
      </div>
    </div>
  );
}
