"use client";

import { useCallback, useSyncExternalStore } from "react";

// One vote per browser (spacing-layout-system.md 7.4): the choice is kept in local
// storage. Mock only (DR-01): no server count. Storage can be blocked (private
// windows), so every access is guarded and the poll still works for the visit.
const PREFIX = "fl-poll:";
const CHANGE_EVENT = "fl-poll-change";

export const pollStorageKey = (pollId: string) => `${PREFIX}${pollId}`;

// Kept in memory when local storage is blocked.
const memory = new Map<string, string>();

function read(pollId: string): string | null {
  try {
    return window.localStorage.getItem(pollStorageKey(pollId));
  } catch {
    return memory.get(pollId) ?? null;
  }
}

function write(pollId: string, optionId: string) {
  memory.set(pollId, optionId);
  try {
    window.localStorage.setItem(pollStorageKey(pollId), optionId);
  } catch {
    // Blocked storage: the memory copy keeps the vote for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(PREFIX)) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// The server does not know the stored vote, so it renders the form.
const getServerVote = () => null;

/** The reader's stored vote for a poll, and a function that records it. */
export function usePollVote(
  pollId: string,
  optionIds: readonly string[],
): [string | null, (optionId: string) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(pollId),
    getServerVote,
  );
  // A stored id that is not an option (an old poll) counts as no vote.
  const vote = stored && optionIds.includes(stored) ? stored : null;
  const castVote = useCallback(
    (optionId: string) => write(pollId, optionId),
    [pollId],
  );
  return [vote, castVote];
}
