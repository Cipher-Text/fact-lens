"use client";

import { Search } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/story/Button";
import { IconButton } from "@/components/story/IconButton";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  strings: Dictionary["header"];
  /**
   * "drawer": 44px field with the search icon inside at the end, no attached button
   * (Drawer.search, DR-349). "dialog": 56px field with the attached submit button
   * (SearchDialog.field).
   */
  size: "drawer" | "dialog";
  /** Marks the field for the dialog that opens the form, so it can take the focus. */
  fieldProps?: Record<`data-${string}`, string>;
  /** The trending terms under the field (SearchDialog.trending). Omit in the Drawer. */
  trendingTerms?: string[];
};

/**
 * The search field with its attached submit button, the clear button and, in the dialog,
 * the trending row (component-system.md C-19, C-20). Mock only (DR-01): a search shows a
 * note instead of results. The field is type="text": a type="search" field takes the
 * first Escape to clear itself, so Escape would not close the dialog in one press
 * (DR-246). The label is hidden; the placeholder is the visible hint.
 */
export function SearchForm({
  strings,
  size,
  fieldProps,
  trendingTerms,
}: Props) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <label htmlFor={fieldId} className="sr-only">
        {strings.searchField}
      </label>
      <div
        className={cn(
          "group/field flex items-center border border-border-interactive bg-background",
          size === "dialog"
            ? "h-14"
            : "h-11 transition-colors duration-200 focus-within:border-interactive",
        )}
      >
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          name="q"
          value={value}
          placeholder={strings.searchPlaceholder}
          enterKeyHint="search"
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value);
            setSubmitted(false);
          }}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent font-ui text-sm font-normal text-ink placeholder:text-ink-muted",
            size === "dialog" ? "px-4" : "px-3",
          )}
          {...fieldProps}
        />
        {size === "drawer" ? (
          <Search
            aria-hidden="true"
            className="me-3 size-(--icon-size) shrink-0 text-ink-muted transition-colors duration-200 group-focus-within/field:text-interactive"
          />
        ) : null}
        {value && size === "dialog" ? (
          <Button
            variant="text"
            className="h-full"
            onClick={() => {
              setValue("");
              setSubmitted(false);
              inputRef.current?.focus();
            }}
          >
            {strings.clear}
          </Button>
        ) : null}
        {size === "dialog" ? (
          <IconButton
            type="submit"
            variant="filled"
            size="field"
            label={strings.searchSubmit}
            icon={Search}
          />
        ) : null}
      </div>
      <p
        role="status"
        className="font-ui text-xs font-medium text-ink-secondary not-empty:mt-3"
      >
        {submitted ? strings.searchUnavailable : null}
      </p>
      {trendingTerms?.length ? (
        <div className="mt-6 flex flex-wrap items-center">
          <h2 className="me-6 font-ui text-xs font-semibold text-ink-muted">
            {strings.trending}
          </h2>
          <ul className="flex flex-wrap items-center" data-trending>
            {trendingTerms.map((term, index) => (
              <li key={term} className="flex items-center">
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="mx-4 size-1 shrink-0 bg-(--color-meta)"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setValue(term);
                    setSubmitted(true);
                  }}
                  className="inline-flex min-h-11 items-center font-ui text-xs font-semibold text-interactive hover:text-interactive-hover active:text-interactive-pressed"
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
