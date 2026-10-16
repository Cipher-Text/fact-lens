"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { SectionHeading } from "@/components/layout/SectionHeading";
import { IconButton } from "@/components/story/IconButton";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import type { Dictionary } from "@/i18n";
import {
  cubicBezier,
  parseCubicBezier,
  sliderEdges,
  sliderTarget,
  type SliderEdges,
} from "@/lib/slider";
import { cn } from "@/lib/utils";

export type RegionPanel = {
  id: string;
  label: string;
  /** RegionSlider.panel body (image story and two stories), rendered on the server. */
  content: ReactNode;
};

type RegionSliderProps = {
  title: string;
  regions: RegionPanel[];
  strings: Dictionary["regionSlider"];
};

// One motion (DR-346): 450ms ease-slide for the scroll of the slider buttons and for each
// half of the phone fade. The curve is the --ease-slide token, read at run time.
const SLIDE_MS = 450;

function slideEasing() {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    "--ease-slide",
  );
  const curve = parseCubicBezier(value);
  return curve ? cubicBezier(...curve) : (t: number) => t;
}

// Buttons show when more regions exist than are in view: 2 from 600px, 3 from 1024px and
// 4 from 1280px (DR-140, DR-141). CSS decides, so the server markup has no layout shift.
function buttonsVisibility(count: number) {
  return cn(
    "hidden shrink-0 gap-2 sm:flex",
    count <= 2 && "sm:max-lg:hidden",
    count <= 3 && "lg:max-xl:hidden",
    count <= 4 && "xl:hidden",
  );
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * C-15 RegionSlider (P-3b, spacing-layout-system.md 7.2 to 7.4).
 * From 600px: one row of region columns in a scroll-snap container (`region-row`), 2 in
 * view, 3 from 1024px, 4 from 1280px. The previous and next buttons move one column
 * (width + gap) in 450ms with ease-slide, or at once with reduced motion, and are disabled
 * at each end. No loop, no autoplay. Swipe is native scrolling; the scrollbar is hidden. All regions are in the HTML, so the keyboard reaches every link.
 * Below 600px: region chips as shadcn Tabs (tablist, arrow keys, aria-selected). One panel
 * shows; a chip press fades it out and the new one in (450ms ease-slide each, opacity only,
 * DR-284, DR-346).
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
  const fadeTimer = useRef<number | undefined>(undefined);
  const [fading, setFading] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const animation = useRef<{ frame: number; target: number } | null>(null);

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
      window.clearTimeout(fadeTimer.current);
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
    const ease = slideEasing();
    // Snap would pull each frame back to a column, so it is off while the row moves.
    row.style.scrollSnapType = "none";
    const start = row.scrollLeft;
    const startTime = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - startTime) / SLIDE_MS, 1);
      row.scrollLeft = start + (target - start) * ease(t);
      if (t < 1) {
        animation.current = { frame: requestAnimationFrame(frame), target };
      } else {
        animation.current = null;
        row.style.scrollSnapType = "";
      }
    };
    animation.current = { frame: requestAnimationFrame(frame), target };
  };

  // A touch, drag or wheel on the row stops the scripted slide, so a swipe is not fought.
  const stopSlide = () => {
    if (!animation.current) return;
    cancelAnimationFrame(animation.current.frame);
    animation.current = null;
    if (rowRef.current) rowRef.current.style.scrollSnapType = "";
  };

  // The selected chip scrolls into view (C-15). Only after a press, never on load.
  const showTab = (index: number) =>
    document.getElementById(`region-${regions[index].id}-tab`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

  // Fade the shown panel out, swap, fade the new one in. Reduced motion: at once.
  const select = (index: number) => {
    if (index === selected) return;
    window.clearTimeout(fadeTimer.current);
    if (prefersReducedMotion()) {
      setSelected(index);
      showTab(index);
      return;
    }
    setFading(true);
    fadeTimer.current = window.setTimeout(() => {
      setSelected(index);
      setFading(false);
      showTab(index);
    }, SLIDE_MS);
  };

  const buttons = (
    <div className={buttonsVisibility(regions.length)}>
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
  );

  return (
    <Tabs
      ref={rootRef}
      value={regions[selected].id}
      onValueChange={(value) =>
        select(regions.findIndex((region) => region.id === value))
      }
    >
      <SectionHeading id="regions-title" actions={buttons}>
        {title}
      </SectionHeading>
      {/* Phone tabs. -mx-1 with p-1 leaves room for the focus ring inside the scroll box;
          the chips stay in line with the shell. */}
      <TabsList
        ref={tablistRef}
        activateOnFocus
        aria-labelledby="regions-title"
        className="-mx-1 mb-(--space-section-title-after) no-scrollbar overflow-x-auto p-1 sm:hidden"
      >
        {regions.map((region) => (
          <TabsTab
            key={region.id}
            value={region.id}
            id={`region-${region.id}-tab`}
            aria-controls={`region-${region.id}`}
            data-region-tab={region.id}
          >
            {region.label}
          </TabsTab>
        ))}
      </TabsList>
      {/* From 600: the slider row (`region-row`, components.css). Below 600 only the
          selected panel shows, faded in and out (DR-284). The row carries the one motion
          (450ms ease-slide) at every width: the phone fade uses it, and from 600 it
          states the slide time that SLIDE_MS runs in JS (DR-346). Keep the two equal. */}
      <div
        ref={rowRef}
        id="regions-row"
        onScroll={updateEdges}
        onPointerDown={stopSlide}
        onWheel={stopSlide}
        className={cn(
          "region-row transition-opacity duration-450 ease-slide",
          fading && "max-sm:opacity-0",
        )}
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
                readers there. */}
            <h3
              id={`region-${region.id}-title`}
              className="mb-(--space-story-media-text) type-story-title-sm text-ink max-sm:sr-only"
            >
              {region.label}
            </h3>
            {region.content}
          </div>
        ))}
      </div>
    </Tabs>
  );
}
