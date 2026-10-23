"use client";

import { Bookmark, BookmarkCheck, Moon, Sun, Type } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useThemeChoice } from "@/components/header/useThemeChoice";
import { nextThemeChoice, setThemeChoice } from "@/lib/theme";

import { Popover } from "./Popover";
import { setTextSize, useReading } from "./reading-store";
import type { ReaderStrings } from "./strings";
import { toast } from "./Toaster";

/** Light and dark, with the site's own theme choice (the .dark class and fl-theme). */
export function ThemeToggle({ t }: { t: ReaderStrings }) {
  const choice = useThemeChoice();
  const label = choice === "dark" ? t.lightTheme : t.darkTheme;
  return (
    <button
      type="button"
      className="rd-iconbtn"
      aria-label={label}
      title={label}
      onClick={() => setThemeChoice(nextThemeChoice(choice))}
    >
      {choice === "dark" ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </button>
  );
}

/** Four text sizes for the article body. */
export function TextSize({
  t,
  side = "bottom",
  buttonClassName,
}: {
  t: ReaderStrings;
  side?: "top" | "bottom";
  buttonClassName?: string;
}) {
  const size = useReading((s) => s.size);
  const names = t.textSizes.split(",");
  return (
    <Popover
      label={t.textSize}
      icon={<Type aria-hidden="true" />}
      side={side}
      buttonClassName={buttonClassName}
    >
      {() => (
        <>
          <p className="rd-pop__label" id="rd-size-label">
            {t.textSize}
          </p>
          <div
            className="rd-sizes"
            role="radiogroup"
            aria-labelledby="rd-size-label"
          >
            {names.map((name, step) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={size === step}
                aria-label={name}
                title={name}
                className="rd-size"
                data-step={step}
                onClick={() => setTextSize(step)}
              >
                {t.textSizeGlyph}
              </button>
            ))}
          </div>
        </>
      )}
    </Popover>
  );
}

// Saved stories: a list of slugs in local storage, for this mock.
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
  slug,
  t,
  compact = false,
}: {
  slug: string;
  t: ReaderStrings;
  compact?: boolean;
}) {
  const raw = useSyncExternalStore(subscribeSaved, readSaved, () => "[]");
  const saved = (JSON.parse(raw) as string[]).includes(slug);

  const toggle = () => {
    const list = JSON.parse(readSaved()) as string[];
    const next = saved ? list.filter((item) => item !== slug) : [...list, slug];
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked.
    }
    window.dispatchEvent(new Event(SAVED_EVENT));
    toast(saved ? t.removedToast : t.savedToast);
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  if (compact) {
    return (
      <button
        type="button"
        className="rd-share__btn"
        data-net="save"
        aria-pressed={saved}
        aria-label={t.save}
        title={t.save}
        onClick={toggle}
      >
        <Icon aria-hidden="true" />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="rd-chip"
      aria-pressed={saved}
      onClick={toggle}
    >
      <Icon aria-hidden="true" />
      {saved ? t.saved : t.save}
    </button>
  );
}

/** The relative time ("3 hours ago"), written after load in the reader's clock. */
export function TimeAgo({ iso, lang }: { iso: string; lang: "bn" | "en" }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const locale = lang === "bn" ? "bn-BD-u-nu-beng" : "en-GB";
    const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const update = () => {
      const seconds = (Date.parse(iso) - Date.now()) / 1000;
      const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 31536000],
        ["month", 2592000],
        ["week", 604800],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
      ];
      const [unit, size] = units.find(
        ([, step]) => Math.abs(seconds) >= step,
      ) ?? ["minute", 60];
      setText(format.format(Math.round(seconds / size), unit));
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [iso, lang]);

  if (!text) return null;
  return <span className="rd-ago">{text}</span>;
}
