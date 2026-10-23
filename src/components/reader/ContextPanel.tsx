"use client";

import { ChevronDown, Telescope } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { ArticleContext } from "@/content/reader";

import type { ReaderStrings } from "./strings";

const OPEN_EVENT = "rd-open-context";

type Tab = "why" | "background" | "timeline" | "numbers";

/** The optional news context: closed by default, in tabs when open. */
export function ContextPanel({
  context,
  t,
}: {
  context: ArticleContext;
  t: ReaderStrings;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("why");
  const tabsRef = useRef<HTMLDivElement>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "why", label: t.tabWhy },
    ...(context.background
      ? [{ id: "background" as const, label: t.tabBackground }]
      : []),
    ...(context.timeline
      ? [{ id: "timeline" as const, label: t.tabTimeline }]
      : []),
    ...(context.numbers
      ? [{ id: "numbers" as const, label: t.tabNumbers }]
      : []),
  ];

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    if (window.location.hash === "#context") onOpen();
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Arrow keys, Home and End move between the tabs.
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex((item) => item.id === tab);
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = tabs[(keys[event.key] + tabs.length) % tabs.length];
    setTab(next.id);
    tabsRef.current
      ?.querySelector<HTMLElement>(`[data-tab="${next.id}"]`)
      ?.focus();
  };

  return (
    <section
      id="context"
      className="rd-context"
      data-open={open || undefined}
      aria-labelledby="rd-context-title"
    >
      <div className="rd-context__head">
        <span className="rd-context__icon" aria-hidden="true">
          <Telescope />
        </span>
        <div>
          <h2 id="rd-context-title" className="rd-context__title">
            {t.context}
          </h2>
          <p className="rd-context__teaser">{context.teaser}</p>
        </div>
        <button
          type="button"
          className="rd-context__toggle"
          aria-expanded={open}
          aria-controls="rd-context-body"
          onClick={() => setOpen((value) => !value)}
        >
          <span>{open ? t.contextClose : t.contextOpen}</span>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
      <div className="rd-context__collapse" id="rd-context-body" inert={!open}>
        <div className="rd-context__inner">
          <div className="rd-context__pad">
            {tabs.length > 1 ? (
              <div
                className="rd-tabs"
                role="tablist"
                aria-label={t.contextTabs}
                ref={tabsRef}
              >
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`rd-tab-${item.id}`}
                    data-tab={item.id}
                    aria-selected={tab === item.id}
                    aria-controls="rd-context-panel"
                    tabIndex={tab === item.id ? 0 : -1}
                    className="rd-tab"
                    onClick={() => setTab(item.id)}
                    onKeyDown={onTabKey}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div
              className="rd-panel"
              id="rd-context-panel"
              role={tabs.length > 1 ? "tabpanel" : undefined}
              aria-labelledby={tabs.length > 1 ? `rd-tab-${tab}` : undefined}
              key={tab}
            >
              {tab === "why" || tab === "background"
                ? (tab === "why"
                    ? context.why
                    : (context.background ?? [])
                  ).map((text) => <p key={text}>{text}</p>)
                : null}
              {tab === "timeline" && context.timeline ? (
                <ol className="rd-timeline">
                  {context.timeline.map((item) => (
                    <li key={item.date}>
                      <span className="rd-timeline__date">{item.date}</span>
                      <p>{item.text}</p>
                    </li>
                  ))}
                </ol>
              ) : null}
              {tab === "numbers" && context.numbers ? (
                <div className="rd-numbers">
                  {context.numbers.map((item) => (
                    <div className="rd-number" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The chip in the hero that scrolls to the context and opens it. */
export function ContextChip({ t }: { t: ReaderStrings }) {
  return (
    <a
      href="#context"
      className="rd-chip rd-chip--ctx"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      <Telescope aria-hidden="true" />
      {t.contextChip}
    </a>
  );
}
