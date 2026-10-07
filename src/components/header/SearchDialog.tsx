"use client";

import { Search, X } from "lucide-react";
import { useCallback, useId } from "react";

import type { Dictionary } from "@/i18n";

import { iconButton, iconButtonElevated } from "./classes";
import { SearchForm } from "./SearchForm";
import { useModalDialog } from "./useModalDialog";

type Props = { strings: Dictionary["header"] };

const FIELD = "[data-search-field]";

/**
 * The search button and the search dialog, from 768px (DR-21). Below 768px the bar
 * has no search button; search is in the drawer. Focus moves to the field. Escape and
 * the close button close the dialog, and focus returns to the search button.
 */
export function SearchDialog({ strings }: Props) {
  const titleId = useId();
  const getInitialFocus = useCallback(
    (dialog: HTMLDialogElement) => dialog.querySelector<HTMLElement>(FIELD),
    [],
  );
  const { dialogRef, triggerRef, open, close, onDialogClick } =
    useModalDialog(getInitialFocus);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={strings.search}
        title={strings.search}
        className={`${iconButton} max-md:hidden`}
      >
        <Search aria-hidden="true" className="size-6" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={onDialogClick}
        data-search-dialog
        className="shell mx-auto mt-(--bar-height) max-w-none bg-surface-elevated text-ink backdrop:bg-overlay"
      >
        <div className="flex flex-col gap-4 p-(--gutter-page)">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="type-ui font-semibold">
              {strings.search}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={strings.closeSearch}
              title={strings.closeSearch}
              className={iconButtonElevated}
            >
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>
          <SearchForm
            strings={strings}
            fieldProps={{ "data-search-field": "" }}
          />
        </div>
      </dialog>
    </>
  );
}
