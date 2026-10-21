import type { StoryStatus } from '@fact-lens/contracts';
import { statusLabel, statusTone, type Tone } from '@/lib/format';

const tones: Record<Tone, string> = {
  neutral: 'bg-line/60 text-fg',
  info: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  good: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200',
  bad: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export const StatusBadge = ({ status }: { status: StoryStatus }) => <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;

export function Panel({ title, children, actions, id }: { title: string; children: React.ReactNode; actions?: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export const buttonClass = (kind: 'primary' | 'secondary' | 'danger' = 'secondary') =>
  `rounded px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
    kind === 'primary' ? 'bg-accent text-accent-fg' : kind === 'danger' ? 'border border-danger text-danger' : 'border border-line bg-panel'
  }`;

export const inputClass = 'w-full rounded border border-line bg-bg px-2 py-1.5 text-sm';

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Notice({ kind, message, issues = [] }: { kind: 'error' | 'ok'; message: string; issues?: string[] }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded border px-3 py-2 text-sm ${kind === 'error' ? 'border-danger text-danger' : 'border-line text-muted'}`}>
      {message}
      {issues.length > 0 ? <ul className="mt-1 list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul> : null}
    </div>
  );
}

export const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted">{children}</p>;

/** Shown when the API refuses a page the person can otherwise see in the menu. */
export function AccessProblem({ mfaRequired }: { mfaRequired: boolean }) {
  return (
    <div role="alert" className="max-w-xl rounded-lg border border-line bg-panel p-4">
      <h1 className="font-semibold">{mfaRequired ? 'A second factor is needed' : 'You do not have access to this page'}</h1>
      <p className="mt-1 text-sm text-muted">
        {mfaRequired
          ? 'This page changes settings that affect the whole newsroom. Sign out, then sign in again using your second factor.'
          : 'Ask an administrator if you think you should be able to open it.'}
      </p>
    </div>
  );
}
