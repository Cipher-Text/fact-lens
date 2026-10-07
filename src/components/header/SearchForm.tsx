"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";

import type { Dictionary } from "@/i18n";

import { filledButton, focusRingElevated } from "./classes";

type Props = {
  strings: Dictionary["header"];
  /** Marks the field for the dialog that opens the form, so it can take the focus. */
  fieldProps?: Record<`data-${string}`, string>;
};

/**
 * The search field and button, used in the drawer (phones) and the search dialog
 * (from 768px). Both sit on surface-elevated. Mock only (DR-01): a search shows a note instead of results.
 * The field is type="text": a type="search" field takes the first Escape to clear itself,
 * so Escape would not close the dialog in one press.
 */
export function SearchForm({ strings, fieldProps }: Props) {
  const fieldId = useId();
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor={fieldId} className="type-ui-sm text-ink-secondary">
        {strings.searchField}
      </label>
      <div className="flex gap-2">
        <input
          id={fieldId}
          type="text"
          name="q"
          enterKeyHint="search"
          autoComplete="off"
          onChange={() => setSubmitted(false)}
          className={`min-h-11 min-w-0 flex-1 border border-border-interactive bg-background px-3 type-input text-ink ${focusRingElevated}`}
          {...fieldProps}
        />
        <button
          type="submit"
          className={`${filledButton} ${focusRingElevated}`}
        >
          <Search aria-hidden="true" className="size-5" />
          {strings.searchSubmit}
        </button>
      </div>
      <p role="status" className="type-ui-sm text-ink-secondary">
        {submitted ? strings.searchUnavailable : null}
      </p>
    </form>
  );
}
