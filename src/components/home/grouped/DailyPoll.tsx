"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";

import { Button } from "@/components/story/Button";
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

// The square marker (C-26, DR-138): no radius, no round radio dot. The native radio input
// stays in the page (visually hidden, so the keyboard and screen readers use it) and this
// box draws it. The focus outline is drawn on the box (COL-13).
const marker =
  "size-5 shrink-0 border border-border-interactive bg-surface-elevated";

/**
 * C-26 DailyPoll: the only P-3 rail module in run 2 (DR-239). Panel on surface-elevated
 * with the panel inset (LAY-20); the section is the container, so the inset and the layout
 * follow the container width: stacked under 600px (the 304px rail, phones), heading and
 * question at the start and options at the end from 600px (the full row under 1024px).
 * Heading type-section-title, plain text (DR-128); question type-story-title-sm; options
 * type-ui; results type-ui-sm with tabular digits in the page language (TYP-17). One vote
 * per browser (usePollVote). Mock data only (DR-01). Never the ad label or ad colors.
 */
export function DailyPoll({ poll, strings }: DailyPollProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const questionId = `${id}-question`;
  const errorId = `${id}-error`;
  const optionIds = poll.options.map((option) => option.id);
  const [vote, castVote] = usePollVote(poll.id, optionIds);
  const [choice, setChoice] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const firstOption = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (justVoted) resultsRef.current?.focus();
  }, [justVoted]);

  return (
    <section
      aria-labelledby={titleId}
      data-poll
      data-voted={vote ? "" : undefined}
      className="@container"
    >
      <div className="bg-surface-elevated panel-inset">
        <div className="poll-layout">
          <div>
            <h2 id={titleId} className="type-section-title text-ink">
              {strings.title}
            </h2>
            <p id={questionId} className="mt-4 type-story-title-sm text-ink">
              {poll.question}
            </p>
          </div>
          {/* The form and the results share one grid cell, so the panel keeps the taller
              height after the vote and the ad below it does not move (LAY-10). The form
              stays in the markup but is hidden from everyone once the reader has voted. */}
          <div className="grid min-w-0 [&>*]:col-start-1 [&>*]:row-start-1">
            {vote ? (
              <PollResults
                poll={poll}
                vote={vote}
                strings={strings}
                ref={resultsRef}
              />
            ) : null}
            <form
              inert={vote ? true : undefined}
              aria-hidden={vote ? true : undefined}
              className={vote ? "invisible" : undefined}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (!choice) {
                  setMissing(true);
                  firstOption.current?.focus();
                  return;
                }
                setJustVoted(true);
                castVote(choice);
              }}
            >
              <fieldset
                aria-labelledby={questionId}
                aria-describedby={missing ? errorId : undefined}
                className="flex min-w-0 flex-col gap-1"
              >
                {poll.options.map((option, index) => (
                  <label
                    key={option.id}
                    className="flex min-h-11 cursor-pointer items-center gap-3 type-ui text-ink"
                  >
                    <input
                      ref={index === 0 ? firstOption : undefined}
                      type="radio"
                      name={`poll-${poll.id}`}
                      value={option.id}
                      checked={choice === option.id}
                      onChange={() => {
                        setChoice(option.id);
                        setMissing(false);
                      }}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        marker,
                        "peer-checked:border-interactive peer-checked:bg-interactive peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                      )}
                    />
                    <span className="min-w-0">{option.label}</span>
                  </label>
                ))}
              </fieldset>
              {missing ? (
                <p id={errorId} className="mt-2 type-ui-sm text-error">
                  {strings.chooseOption}
                </p>
              ) : null}
              <Button type="submit" fullWidth className="mt-6">
                {strings.vote}
              </Button>
            </form>
          </div>
        </div>
        {/* The live region exists before the vote, so screen readers announce it. */}
        <p role="status" className="sr-only">
          {justVoted ? strings.voted : null}
        </p>
      </div>
    </section>
  );
}

type PollResultsProps = {
  poll: Poll;
  vote: string;
  strings: Dictionary["poll"];
  ref: Ref<HTMLDivElement>;
};

/**
 * The results (C-26): each option row fills to its percent. The reader's own vote keeps the
 * filled interactive marker and the words "your vote" (COL-17, TYP-24); the others have a
 * border-colored marker. The fill color is not in the specs (U-24).
 */
function PollResults({ poll, vote, strings, ref }: PollResultsProps) {
  const { results, total } = pollResults(poll.options, vote);
  const labels = new Map(poll.options.map((o) => [o.id, o.label]));
  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-poll-results
      className="min-w-0 focus:outline-none"
    >
      <ul className="flex flex-col gap-1">
        {results.map((result) => {
          const mine = result.id === vote;
          return (
            <li
              key={result.id}
              data-poll-result={result.id}
              className="relative flex min-h-11 items-center gap-3 px-3 type-ui-sm text-ink"
            >
              {/* The fill repeats the percent in the row, so it is hidden from screen readers. */}
              <span
                aria-hidden="true"
                data-poll-bar
                className="absolute inset-y-0 start-0 border-b-4 border-interactive bg-accent-soft"
                style={{ inlineSize: `${result.percent}%` }}
              />
              <span
                aria-hidden="true"
                className={cn(
                  marker,
                  "relative",
                  mine && "border-interactive bg-interactive",
                )}
              />
              <span className="relative min-w-0 flex-1">
                {labels.get(result.id)}
                {mine ? (
                  <span className="text-ink-secondary">
                    {" "}
                    {strings.yourVote}
                  </span>
                ) : null}
              </span>
              <span className="relative shrink-0 tabular-nums">
                {formatPercent(result.percent, poll.lang)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 type-ui-sm text-ink-muted tabular-nums">
        {fill(strings.total, { count: formatNumber(total, poll.lang) })}
      </p>
    </div>
  );
}
