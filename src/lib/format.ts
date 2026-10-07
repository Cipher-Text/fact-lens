import type { Lang } from "@/i18n/config";

// Format numbers and dates for the page language (TYP-17). Bangla uses Bangla digits.
const locales: Record<Lang, string> = { bn: "bn-BD", en: "en-GB" };

const TIME_ZONE = "Asia/Dhaka";

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang]).format(value);
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(locales[lang], {
    dateStyle: "long",
    timeZone: TIME_ZONE,
  }).format(date);
}
