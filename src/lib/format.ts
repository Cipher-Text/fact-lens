import type { Lang } from "@/i18n/config";

// Format numbers and dates for the page language (TYP-17). Bangla uses Bangla digits.
const locales: Record<Lang, string> = { bn: "bn-BD", en: "en-GB" };

const TIME_ZONE = "Asia/Dhaka";

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang]).format(value);
}

/** A year without a thousands separator: "2026" or "২০২৬". */
export function formatYear(year: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang], { useGrouping: false }).format(
    year,
  );
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(locales[lang], {
    dateStyle: "long",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** Clock time, 24-hour, in Dhaka time: "09:15" or "০৯:১৫". No AM/PM, so no English word on a Bangla page. */
export function formatTime(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(locales[lang], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
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
