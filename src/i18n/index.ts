import { bn } from "./bn";
import type { Lang } from "./config";
import { en } from "./en";
import type { Dictionary } from "./types";

export type { Dictionary, ReaderStrings } from "./types";
export * from "./config";

const dictionaries: Record<Lang, Dictionary> = { bn, en };

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}
