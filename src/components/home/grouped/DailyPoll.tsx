"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";

import type { Poll } from "@/content";
import type { Dictionary } from "@/i18n";
import { fill, formatNumber, formatPercent } from "@/lib/format";
import { pollResults } from "@/lib/poll";
import { cn } from "@/lib/utils";

import { focusRing } from "@/components/header/classes";

import { railHeading, railModule, submitButton } from "./classes";
import { usePollVote } from "./usePollVote";

const questionClass = "mt-(--space-story-title-summary) type-summary text-ink";

type DailyPollProps = {
  poll: Poll;
  strings: Dictionary["poll"];
};

/**
 * The P-3 daily poll (spacing-layout-system.md 7.4): one question, 2 to 4 options and a
 * vote button, then result bars. One vote per browser (usePollVote). Mock data only
 * (DR-01). Options in type-ui, results in type-ui-sm with tabular digits in the page
 * language (typography-system.md 7.1, TYP-17). The reader's own option is named in text,
 * not by color only (TYP-24). The question role and the bar look are not in the specs (U-24).
 */
export function DailyPoll({ poll, strings }: DailyPollProps) {
  const id = useId();
  const titleId = `${id}-title`;
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
      className={railModule}
    >
      <h2 id={titleId} className={railHeading}>
        {strings.title}
      </h2>
      {vote ? (
        <PollResults
          poll={poll}
          vote={vote}
          strings={strings}
          ref={resultsRef}
        />
      ) : (
        <form
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
            aria-describedby={missing ? errorId : undefined}
          >
            <legend className={questionClass}>{poll.question}</legend>
            <div className="mt-(--space-story-summary-meta) flex flex-col">
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
                    className={cn(
                      "size-5 shrink-0 accent-interactive",
                      focusRing,
                    )}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          {missing ? (
            <p id={errorId} className="mt-2 type-ui-sm text-error">
              {strings.chooseOption}
            </p>
          ) : null}
          <button type="submit" className={cn("mt-3", submitButton)}>
            {strings.vote}
          </button>
        </form>
      )}
      {/* The live region exists before the vote, so screen readers announce it. */}
      <p role="status" className="sr-only">
        {justVoted ? strings.voted : null}
      </p>
    </section>
  );
}

type PollResultsProps = {
  poll: Poll;
  vote: string;
  strings: Dictionary["poll"];
  ref: Ref<HTMLDivElement>;
};

function PollResults({
  poll,
  vote,
  strings,
  ref,
}: PollResultsProps) {
  const { results, total } = pollResults(poll.options, vote);
  const labels = new Map(poll.options.map((o) => [o.id, o.label]));
  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-poll-results
      className="focus:outline-none"
    >
      <p className={questionClass}>{poll.question}</p>
      <ul className="mt-(--space-story-summary-meta) flex flex-col gap-3">
        {results.map((result) => {
          const mine = result.id === vote;
          return (
            <li key={result.id} data-poll-result={result.id}>
              <p className="flex items-baseline justify-between gap-3 type-ui-sm text-ink">
                <span>
                  {labels.get(result.id)}
                  {mine ? (
                    <span className="text-ink-secondary">
                      {" "}
                      {strings.yourVote}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPercent(result.percent, poll.lang)}
                </span>
              </p>
              {/* The bar repeats the percent beside it, so it is hidden from screen readers. */}
              <div aria-hidden="true" className="mt-1 h-2 bg-border-soft">
                <div
                  data-poll-bar
                  className="h-full bg-interactive"
                  style={{ inlineSize: `${result.percent}%` }}
                />
              </div>
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
