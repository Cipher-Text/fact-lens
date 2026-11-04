"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/story/Button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Poll } from "@/content";
import type { Dictionary } from "@/i18n";
import { fill, formatNumber, formatPercent } from "@/lib/format";
import { pollResults } from "@/lib/poll";
import { cn } from "@/lib/utils";

import { usePollVote } from "./usePollVote";

type DailyPollProps = {
  poll: Poll;
  strings: Dictionary["poll"];
};

/**
 * C-26 DailyPoll: the only P-3 rail module in run 2 (DR-239). No panel: it sits on the page
 * background (DR-273). The section is the container: one column under 600px (the 304px
 * rail, phones), heading and question at the start and options and button at the end from
 * 600px (poll-layout, DR-298). The question is the legend of the fieldset that holds the
 * RadioGroup, so it names the group. The results take the cell of the options and the
 * button, so the vote does not change the height (LAY-10). One vote per browser
 * (usePollVote). Mock data only (DR-01). Never the ad label or ad colors.
 */
export function DailyPoll({ poll, strings }: DailyPollProps) {
  const [vote, castVote] = usePollVote(
    poll.id,
    poll.options.map((option) => option.id),
  );
  const [choice, setChoice] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The vote button leaves the page, so focus moves to the poll heading (C-26, DR-346). The
  // results are in role status, so the change is announced.
  useEffect(() => {
    if (justVoted) headingRef.current?.focus();
  }, [justVoted]);

  // After the vote the choose parts stay in the cell, hidden, to keep the height.
  const hidden = vote
    ? { inert: true, "aria-hidden": true, className: "invisible" }
    : {};

  return (
    <section
      aria-labelledby={`${poll.id}-title`}
      data-poll
      data-voted={vote ? "" : undefined}
      className="@container"
    >
      <div className="poll-layout">
        <h2
          ref={headingRef}
          id={`${poll.id}-title`}
          tabIndex={-1}
          data-poll-part="heading"
          className="font-editorial text-section font-semibold text-ink"
        >
          {strings.title}
        </h2>
        {/* The fieldset has no box of its own: the legend and the group sit in the grid. */}
        <fieldset className="contents">
          <legend
            data-poll-part="question"
            className="font-editorial text-lg font-semibold text-ink"
          >
            {poll.question}
          </legend>
          <div data-poll-part="cell" {...hidden}>
            <RadioGroup
              onValueChange={(value) => setChoice(String(value))}
              disabled={Boolean(vote)}
            >
              {poll.options.map((option) => (
                <RadioGroupItem key={option.id} value={option.id}>
                  {option.label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
            <Button
              fullWidth
              className="mt-6"
              onClick={() => {
                // No choice: nothing happens and focus stays on the button (C-26, DR-348).
                if (!choice) return;
                setJustVoted(true);
                castVote(choice);
              }}
            >
              {strings.vote}
            </Button>
          </div>
        </fieldset>
        {/* Before the vote a hidden copy of the results holds the cell at the height of the
            results, because they are taller than the choose parts (LAY-10). */}
        <PollResults poll={poll} vote={vote} strings={strings} />
      </div>
    </section>
  );
}

type PollResultsProps = {
  poll: Poll;
  vote: string | null;
  strings: Dictionary["poll"];
};

/**
 * The results (C-26): in role status, so the change is announced. Per option a label line
 * (the own vote adds " · Your vote") and a bar. The own vote is `interactive`, the others
 * `fill-neutral`, on a `border` track (COL-17, DR-295). The bars repeat the percent, so
 * they are hidden from screen readers.
 */
function PollResults({ poll, vote, strings }: PollResultsProps) {
  const { results, total } = pollResults(poll.options, vote);
  const labels = new Map(poll.options.map((o) => [o.id, o.label]));
  const live = vote
    ? { role: "status", "data-poll-results": "" }
    : { inert: true, "aria-hidden": true, "data-poll-ghost": "" };
  return (
    <div
      data-poll-part="cell"
      className={cn("min-w-0", !vote && "invisible")}
      {...live}
    >
      <ul className="flex flex-col gap-4">
        {results.map((result) => {
          const mine = result.id === vote;
          return (
            <li
              key={result.id}
              data-poll-result={vote ? result.id : undefined}
              className="flex flex-col gap-2"
            >
              <span className="font-ui text-sm font-medium text-ink">
                {labels.get(result.id)}
                {mine ? ` · ${strings.yourVote}` : null}
              </span>
              <PollBar
                percent={result.percent}
                mine={mine}
                text={formatPercent(result.percent, poll.lang)}
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-4 font-ui text-xs font-medium text-ink-muted tabular-nums">
        {fill(strings.total, { count: formatNumber(total, poll.lang) })}
      </p>
    </div>
  );
}

type PollBarProps = { percent: number; mine: boolean; text: string };

/**
 * One bar: 32px, no radius. The percent sits in the track at the end edge. It is `ink`; when
 * the fill reaches the start of the number, the whole number turns `background`. The page
 * measures it, because the width of the number and the track change with the language and
 * the rail (C-26, DR-273).
 */
function PollBar({ percent, mine, text }: PollBarProps) {
  const track = useRef<HTMLSpanElement>(null);
  const number = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const trackEl = track.current;
    const numberEl = number.current;
    if (!trackEl || !numberEl) return;
    const measure = () => {
      const fillEnd = (trackEl.clientWidth * percent) / 100;
      numberEl.toggleAttribute("data-over", fillEnd >= numberEl.offsetLeft);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(trackEl);
    observer.observe(numberEl);
    return () => observer.disconnect();
  }, [percent, text]);

  return (
    <span
      ref={track}
      aria-hidden="true"
      className="relative flex h-8 w-full items-center justify-end bg-border pe-2"
    >
      <span
        data-poll-bar
        className={cn(
          "absolute inset-y-0 start-0",
          mine ? "bg-interactive" : "bg-fill-neutral",
        )}
        style={{ inlineSize: `${percent}%` }}
      />
      <span
        ref={number}
        className="relative font-ui text-xs font-medium text-ink tabular-nums data-over:text-background"
      >
        {text}
      </span>
    </span>
  );
}
