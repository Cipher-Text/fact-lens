"use client";

import { useEffect, useRef, type ReactNode } from "react";

import {
  getReading,
  readStoredSize,
  resetReading,
  setReading,
  useReading,
} from "./reading-store";

type Props = {
  minutes: number;
  category: string;
  className?: string;
  children: ReactNode;
};

// The reading line sits a little above the middle of the screen: the text that crosses
// it counts as read.
// The reader sizes of the typography tokens: --reader-scale 1, 1.2 and 1.4.
const READER_SIZES = [undefined, "lg", "xl"] as const;

const READING_LINE = 0.45;
// A section counts as the one being read once its heading passes this line.
const SECTION_LINE = 0.35;

/**
 * Places the contents marker. The reading line is mapped piece by piece: the top of the
 * body to the top of the list, each section heading to the middle of its item, and the end
 * of the body to the end of the list. Between two of those points the marker moves in
 * step with the scroll, so it flows from item to item.
 */
function flowToc(
  toc: HTMLElement,
  body: DOMRect,
  tops: number[],
  line: number,
) {
  const items = [...toc.querySelectorAll<HTMLElement>("[data-toc-item]")];
  if (items.length !== tops.length) return;
  const from = [body.top, ...tops, body.bottom];
  const to = [
    0,
    ...items.map((item) => item.offsetTop + item.offsetHeight / 2),
    toc.offsetHeight,
  ];
  let y = 0;
  if (line >= from[from.length - 1]) y = to[to.length - 1];
  else {
    for (let i = 0; i < from.length - 1; i++) {
      if (line >= from[i] && line < from[i + 1]) {
        const share = (line - from[i]) / Math.max(1, from[i + 1] - from[i]);
        y = to[i] + share * (to[i + 1] - to[i]);
        break;
      }
    }
  }
  toc.style.setProperty("--rd-toc-y", `${y.toFixed(1)}px`);
}

/**
 * The page root. It measures the reading progress on scroll and writes it to the CSS
 * variable --rd-progress and to the reading store.
 */
export function ReaderRoot({ minutes, category, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useReading((s) => s.size);
  const done = useReading((s) => s.done);

  useEffect(() => {
    resetReading(minutes);
    const stored = readStoredSize();
    if (stored !== null) setReading({ size: stored });

    const root = ref.current;
    if (!root) return;
    const body = root.querySelector<HTMLElement>("[data-reader-body]");
    const title = root.querySelector<HTMLElement>("[data-reader-title]");
    const toc = root.querySelector<HTMLElement>("[data-toc]");
    let lastY = window.scrollY;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      let progress = 0;
      let active: string | null = null;
      if (body) {
        const rect = body.getBoundingClientRect();
        progress = Math.min(
          1,
          Math.max(0, (vh * READING_LINE - rect.top) / rect.height),
        );
        const line = vh * SECTION_LINE;
        const headings = [
          ...body.querySelectorAll<HTMLElement>("h2[data-section]"),
        ];
        const tops = headings.map(
          (heading) => heading.getBoundingClientRect().top,
        );
        headings.forEach((heading, index) => {
          if (tops[index] < line) active = heading.id;
        });
        if (toc) flowToc(toc, rect, tops, line);
      }
      root.style.setProperty("--rd-progress", progress.toFixed(4));

      // Hide the bar while the reader scrolls down; show it again on the way up.
      const delta = y - lastY;
      let hidden = getReading().hidden;
      if (y < 240) hidden = false;
      else if (delta > 10) hidden = true;
      else if (delta < -10) hidden = false;
      if (Math.abs(delta) > 10) lastY = y;

      setReading({
        percent: Math.round(progress * 100),
        minutesLeft: Math.max(0, Math.ceil(minutes * (1 - progress))),
        active,
        past: title ? title.getBoundingClientRect().bottom < 72 : false,
        hidden,
        scrolled: y > 8,
        started: progress > 0,
        done: progress >= 0.995,
      });
    };

    // Browsers fire scroll at most once a frame, so measuring here is cheap. Resize and
    // layout changes wait for the next frame.
    const onScroll = () => measure();
    const onLayout = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onLayout);
    // The body changes height when the text size changes.
    const observer = new ResizeObserver(onLayout);
    if (body) observer.observe(body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onLayout);
      observer.disconnect();
    };
  }, [minutes]);

  return (
    <div
      ref={ref}
      className={className ? `rd ${className}` : "rd"}
      data-cat={category}
      data-reader-size={READER_SIZES[size]}
      data-done={done || undefined}
    >
      {children}
    </div>
  );
}
