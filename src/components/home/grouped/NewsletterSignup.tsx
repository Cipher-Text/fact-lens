"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { textLink } from "@/components/story/links";
import type { Lang } from "@/content";
import { localizedPath, type Dictionary } from "@/i18n";
import { isValidEmail } from "@/lib/email";

import { railHeading, railModule, submitButton, textField } from "./classes";

type Status = "idle" | "error" | "sending" | "done";

// Mock only (DR-01): the "sending" state lasts this long, then the form shows "done".
export const MOCK_SEND_MS = 800;

type NewsletterSignupProps = {
  lang: Lang;
  strings: Dictionary["newsletter"];
};

/**
 * The P-3 newsletter (spacing-layout-system.md 7.4): heading, one line of text, email
 * field, button, consent line with a privacy link, and error, sending and done states.
 * The form uses its own check (noValidate), so the error is in the page language (T-27).
 * The visible field label and the consent line role are not in the specs (U-23).
 * The section id is the anchor of the Subscribe link in the top bar (IMP-14).
 */
export function NewsletterSignup({ lang, strings }: NewsletterSignupProps) {
  const id = useId();
  const fieldId = `${id}-email`;
  const errorId = `${id}-error`;
  const titleId = `${id}-title`;
  const [status, setStatus] = useState<Status>("idle");
  const fieldRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (status === "done") doneRef.current?.focus();
  }, [status]);

  const sending = status === "sending";
  const invalid = status === "error";

  return (
    <section
      id="newsletter"
      aria-labelledby={titleId}
      data-newsletter
      data-status={status}
      className={railModule}
    >
      <h2 id={titleId} className={railHeading}>
        {strings.title}
      </h2>
      <p className="mt-(--space-story-title-summary) type-summary text-ink-secondary">
        {strings.text}
      </p>
      {status !== "done" ? (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (sending) return;
            const email = fieldRef.current?.value ?? "";
            if (!isValidEmail(email)) {
              setStatus("error");
              fieldRef.current?.focus();
              return;
            }
            setStatus("sending");
            timer.current = setTimeout(() => setStatus("done"), MOCK_SEND_MS);
          }}
          className="mt-(--space-story-summary-meta) flex flex-col gap-2"
        >
          <label htmlFor={fieldId} className="type-ui-sm text-ink-secondary">
            {strings.emailLabel}
          </label>
          <input
            ref={fieldRef}
            id={fieldId}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            readOnly={sending}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            onChange={() => {
              if (invalid) setStatus("idle");
            }}
            className={textField}
          />
          {invalid ? (
            <p id={errorId} className="type-ui-sm text-error">
              {strings.invalidEmail}
            </p>
          ) : null}
          <button
            type="submit"
            aria-disabled={sending || undefined}
            className={submitButton}
          >
            {sending ? strings.sending : strings.submit}
          </button>
          <p className="type-ui-sm text-ink-secondary">
            {strings.consentBefore}
            <Link
              href={localizedPath(lang, "/privacy")}
              className={`${textLink} underline underline-offset-2`}
            >
              {strings.privacy}
            </Link>
            {strings.consentAfter}
          </p>
        </form>
      ) : null}
      {/* The live region exists before the change, so screen readers announce it. */}
      <div
        ref={doneRef}
        role="status"
        tabIndex={status === "done" ? -1 : undefined}
        className="focus:outline-none"
      >
        {sending ? <p className="sr-only">{strings.sending}</p> : null}
        {status === "done" ? (
          <div className="mt-(--space-story-summary-meta) bg-success-subtle px-3 py-2">
            <p className="type-ui text-success">{strings.done}</p>
            <p className="type-ui-sm text-ink">{strings.mockNote}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
