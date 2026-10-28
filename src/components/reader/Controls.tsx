"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSyncExternalStore, type KeyboardEvent } from "react";

import { Popover } from "./Popover";
import { setTextSize, useReading } from "./reading-store";
import type { ReaderStrings } from "@/i18n";
import { parseSaved } from "@/lib/saved";
import { toast } from "./Toaster";

/**
 * Three text sizes for the article body (TYP-15), as a radio group. Arrow keys move between them, as
 * in any radio group.
 */
export function TextSizeOptions({
  t,
  labelledBy,
}: {
  t: ReaderStrings;
  labelledBy: string;
}) {
  const size = useReading((s) => s.size);
  const names = t.textSizes.split(",");
  // The same glyph at one size, marked +, ++ for the larger steps.
  const glyphs = t.textSizeGlyphs.split(",");
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key
    ];
    if (!step) return;
    event.preventDefault();
    // Step from the radio that has focus, not from the stored size.
    const from = Number(
      (event.target as HTMLElement).closest<HTMLElement>("[data-step]")?.dataset
        .step ?? size,
    );
    const next = Math.min(names.length - 1, Math.max(0, from + step));
    setTextSize(next);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-step="${next}"]`)
      ?.focus();
  };
  return (
    <div
      className="rd-sizes"
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKey}
    >
      {names.map((name, step) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={size === step}
          aria-label={name}
          title={name}
          tabIndex={size === step ? 0 : -1}
          className="rd-size"
          data-step={step}
          onClick={() => setTextSize(step)}
        >
          {glyphs[step]}
        </button>
      ))}
    </div>
  );
}

/** The text sizes behind one button, for the bottom bar on narrow screens. */
export function TextSize({
  t,
  side = "bottom",
}: {
  t: ReaderStrings;
  side?: "top" | "bottom";
}) {
  return (
    <Popover
      label={t.textSize}
      // The page's own letter (অ or A), not a Latin T: Bangla pages show Bangla only.
      icon={
        <span className="rd-iconbtn__glyph" aria-hidden="true">
          {t.textSizeGlyphs.split(",")[0]}
        </span>
      }
      side={side}
    >
      {() => (
        <>
          <p className="rd-pop__label" id="rd-size-pop">
            {t.textSize}
          </p>
          <TextSizeOptions t={t} labelledBy="rd-size-pop" />
        </>
      )}
    </Popover>
  );
}

// Saved stories: a list of story ids in local storage (src/lib/saved.ts). The id, not
// the slug, because only the id is fixed for the story's life (layout 7C).
const SAVED_KEY = "rd-saved";
const SAVED_EVENT = "rd-saved-change";

function readSaved(): string {
  try {
    return window.localStorage.getItem(SAVED_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribeSaved(onChange: () => void) {
  window.addEventListener(SAVED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SAVED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function SaveButton({
  storyId,
  t,
}: {
  storyId: string;
  t: ReaderStrings;
}) {
  const raw = useSyncExternalStore(subscribeSaved, readSaved, () => "[]");
  const saved = parseSaved(raw).includes(storyId);

  const toggle = () => {
    const list = parseSaved(readSaved());
    const next = saved
      ? list.filter((item) => item !== storyId)
      : [...list, storyId];
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked.
    }
    window.dispatchEvent(new Event(SAVED_EVENT));
    toast(saved ? t.removedToast : t.savedToast);
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      className="rd-iconbtn"
      aria-pressed={saved}
      aria-label={t.save}
      title={t.save}
      onClick={toggle}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
