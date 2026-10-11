"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * A native modal <dialog> for the drawer and the search dialog (spacing-layout-system.md
 * Section 6). showModal() makes the page behind it inert and closes it on Escape.
 * This hook adds the rest: focus moves to the element that `getInitialFocus` returns,
 * the page does not scroll behind the dialog, a click on the scrim closes it, and focus
 * returns to the button that opened it. A nav link closes it with `closeForLink`, which
 * moves the focus to the link's target when the target is on the page (the browser
 * itself returns focus to the opening button when a modal dialog closes).
 */
export function useModalDialog(
  getInitialFocus: (dialog: HTMLDialogElement) => HTMLElement | null,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Set by closeForLink: the element that gets the focus instead of the trigger.
  const linkTarget = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.dataset.modalOpen = "";
    getInitialFocus(dialog)?.focus();
  }, [getInitialFocus]);

  const close = useCallback(() => dialogRef.current?.close(), []);

  const closeForLink = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      const hash = event.currentTarget.hash;
      linkTarget.current = hash ? document.getElementById(hash.slice(1)) : null;
      dialogRef.current?.close();
    },
    [],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Runs for Escape, the close button, the scrim and a drawer link.
    const onClose = () => {
      delete document.documentElement.dataset.modalOpen;
      const target = linkTarget.current;
      linkTarget.current = null;
      if (target) {
        if (!target.hasAttribute("tabindex"))
          target.setAttribute("tabindex", "-1");
        target.focus();
      } else {
        triggerRef.current?.focus();
      }
    };
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("close", onClose);
      delete document.documentElement.dataset.modalOpen;
    };
  }, []);

  /** Put on the <dialog>. The panel fills the dialog, so only a click on the scrim targets it. */
  const onDialogClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    },
    [],
  );

  return { dialogRef, triggerRef, open, close, closeForLink, onDialogClick };
}
