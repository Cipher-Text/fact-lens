'use client';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-lg border border-danger p-4">
      <h1 className="font-semibold text-danger">This page could not load</h1>
      <p className="mt-1 text-sm text-muted">The newsroom server or the API did not answer as expected. Nothing you did was lost.</p>
      {error.digest ? <p className="mt-1 text-xs text-muted">Reference: {error.digest}</p> : null}
      <button type="button" onClick={reset} className="mt-3 rounded border border-line px-3 py-1.5 text-sm">Try again</button>
    </div>
  );
}
