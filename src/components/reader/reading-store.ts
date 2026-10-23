"use client";

import { useSyncExternalStore } from "react";

import { storeReaderSize } from "@/lib/reader-size";

/**
 * Reading state for the article page. ReaderRoot writes it on scroll; the parts that
 * show progress read only the values they need, so a scroll re-renders very little.
 * The progress itself is also written to the CSS variable --rd-progress, which the
 * progress line, the rings and the contents track use without any re-render.
 */
export interface ReadingState {
  percent: number; // 0 to 100
  minutesLeft: number;
  active: string | null; // id of the section being read
  past: boolean; // the headline has scrolled out of view
  hidden: boolean; // the bar is hidden while the reader scrolls down
  scrolled: boolean;
  started: boolean; // the body has come into view
  done: boolean;
  size: number; // reader size step: 0 default, 1 lg, 2 xl (typography tokens)
}

const initial: ReadingState = {
  percent: 0,
  minutesLeft: 0,
  active: null,
  past: false,
  hidden: false,
  scrolled: false,
  started: false,
  done: false,
  size: 0,
};

let state = initial;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReading(): ReadingState {
  return state;
}

export function setReading(patch: Partial<ReadingState>) {
  let changed = false;
  for (const key of Object.keys(patch) as (keyof ReadingState)[]) {
    if (patch[key] !== state[key]) changed = true;
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function resetReading(minutes: number) {
  state = { ...initial, size: state.size, minutesLeft: minutes };
  listeners.forEach((listener) => listener());
}

/** One value of the reading state. The selector must return a primitive. */
export function useReading<T>(select: (s: ReadingState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(initial),
  );
}

export function setTextSize(size: number) {
  setReading({ size });
  storeReaderSize(size);
}
