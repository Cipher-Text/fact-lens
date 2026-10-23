"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type Props = {
  label: string;
  icon: ReactNode;
  side?: "top" | "bottom";
  buttonClassName?: string;
  children: (close: () => void) => ReactNode;
};

/**
 * A button with a small panel. Escape and a click outside close it, and focus goes back
 * to the button. Focus that leaves the panel also closes it. The panel takes focus on its
 * checked control, else its control in the Tab order, else its first control.
 */
export function Popover({
  label,
  icon,
  side = "bottom",
  buttonClassName = "rd-iconbtn",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = wrap.current?.querySelector<HTMLElement>("[data-panel]");
    (
      panel?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      panel?.querySelector<HTMLElement>('[tabindex="0"]') ??
      panel?.querySelector<HTMLElement>("a, button")
    )?.focus();

    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    // Tab out of the panel closes it, as Escape does, but focus stays where the reader
    // moved it.
    const onFocus = (event: FocusEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  // Closes from inside the panel. It finds the button by id, not by the ref: the ref is
  // not read while the panel renders (react-hooks/refs).
  const close = () => {
    setOpen(false);
    document.getElementById(`${id}-button`)?.focus();
  };

  return (
    <div className="rd-pop" ref={wrap}>
      <button
        ref={button}
        id={`${id}-button`}
        type="button"
        className={buttonClassName}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
      </button>
      {open ? (
        <div className="rd-pop__panel" id={id} data-panel data-side={side}>
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
