import type { bn } from "./bn";

type Strings<T> = {
  [K in keyof T]: T[K] extends string ? string : Strings<T[K]>;
};

/** The shape of a string table. bn.ts sets the keys; en.ts must have the same keys. */
export type Dictionary = Strings<typeof bn>;

/** The article page strings. */
export type ReaderStrings = Dictionary["reader"];
