"use client";

import { Search, X } from "lucide-react";
import { useCallback } from "react";

import { IconButton } from "@/components/story/IconButton";
import type { Dictionary } from "@/i18n";

import { SearchForm } from "./SearchForm";
import { useModalDialog } from "./useModalDialog";

type Props = {
  strings: Dictionary["header"];
  trendingTerms: string[];
};

const FIELD = "[data-search-field]";

/**
 * C-20 SearchDialog: the search button in the top bar and the modal panel, from 768px
 * (DR-21). Below 768px the bar has no search button; search is in the Drawer. The panel is
 * full width at the top on surface-elevated, with 96px above and 56px below, and its
 * content in the shell (DR-190). There is no open or close animation (DR-227). Focus moves
 * to the field. Escape, the close button and a press on the backdrop close it, and focus
 * returns to the search button.
 *
 * Built on the native <dialog> instead of the shadcn Dialog (CPT-16): showModal() gives the
 * inert page, Escape and the top layer. A flag for tajmin is in the R2-05 handover.
 */
export function SearchDialog({ strings, trendingTerms }: Props) {
  const getInitialFocus = useCallback(
    (dialog: HTMLDialogElement) => dialog.querySelector<HTMLElement>(FIELD),
    [],
  );
  const { dialogRef, triggerRef, open, close, onDialogClick } =
    useModalDialog(getInitialFocus);

  return (
    <>
      <IconButton
        ref={triggerRef}
        variant="ghost"
        icon={Search}
        label={strings.search}
        title={strings.search}
        aria-haspopup="dialog"
        onClick={open}
        className="max-md:hidden"
        data-search-trigger=""
      />

      <dialog
        ref={dialogRef}
        aria-label={strings.search}
        onClick={onDialogClick}
        data-search-dialog
        className="m-0 w-full max-w-none bg-surface-elevated p-0 text-ink backdrop:bg-overlay"
      >
        <div className="relative">
          <IconButton
            variant="ghost"
            icon={X}
            label={strings.closeSearch}
            title={strings.closeSearch}
            onClick={close}
            className="absolute end-(--top-bar-inset) top-3"
          />
          <div className="shell pt-24 pb-14">
            <SearchForm
              strings={strings}
              size="dialog"
              fieldProps={{ "data-search-field": "" }}
              trendingTerms={trendingTerms}
            />
          </div>
        </div>
      </dialog>
    </>
  );
}
