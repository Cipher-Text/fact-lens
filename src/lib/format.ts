import type { Lang } from "@/i18n/config";

// Format numbers and dates for the page language (TYP-17). Bangla uses Bangla digits; `-u-nu-beng`
// sets them, because WebKit gives Latin digits for plain `bn-BD` and hydration then fails.
const locales: Record<Lang, string> = { bn: "bn-BD-u-nu-beng", en: "en-GB" };

const TIME_ZONE = "Asia/Dhaka";

/** A number in the page language. `minDigits` pads with zeros: 2 gives "01" or "০১". */
export function formatNumber(value: number, lang: Lang, minDigits = 1): string {
  return new Intl.NumberFormat(locales[lang], {
    minimumIntegerDigits: minDigits,
  }).format(value);
}

/** A year without a thousands separator: "2026" or "২০২৬". */
export function formatYear(year: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang], { useGrouping: false }).format(
    year,
  );
}

/**
 * The current year in Dhaka time, for the footer (C-21). The server may run in UTC, so
 * `getFullYear` would show the old year for the first six hours of 1 January in Dhaka.
 */
export function dhakaYear(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(now),
  );
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(locales[lang], {
    dateStyle: "long",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** Fills {name} placeholders in a string from the string tables. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** A whole percent in the page language: "38%" or "৩৮%". `value` is 0 to 100. */
export function formatPercent(value: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang], {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
