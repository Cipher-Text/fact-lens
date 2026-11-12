'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { assignmentRoles, type Assignment } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { formatDateTime } from '@/lib/format';
import { submitWith } from '@/lib/form';
import { buttonClass, Empty, Field, inputClass, Notice } from './ui';

type Failure = { message: string; issues: string[] } | null;

export function AssignmentParts({ newsId, assignments, canCreate }: { newsId: string; assignments: Assignment[]; canCreate: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<Failure>(null);
  const [pending, start] = useTransition();

  const run = (path: string, body?: { assignee: string; role: (typeof assignmentRoles)[number]; dueAt?: string }) => {
    setError(null);
    start(async () => {
      const res = await bff('POST', path, body);
      if (!res.ok) {
        setError({ message: res.reason === 'mfa_required' ? 'This step needs a sign-in with a second factor.' : res.message, issues: res.issues });
        return;
      }
      announce('Saved');
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {assignments.length === 0 ? <Empty>Nobody is assigned.</Empty> : (
        <ul className="space-y-1 text-sm">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>{assignment.assignee} · {assignment.role.replace('_', ' ')} · <span className="text-muted">{assignment.status}{assignment.dueAt ? ` · due ${formatDateTime(assignment.dueAt)}` : ''}</span></span>
              {assignment.status === 'open' ? (
                <span className="flex gap-2">
                  <button type="button" disabled={pending} className={buttonClass()} onClick={() => run(`assignments/${assignment.id}/complete`)}>Complete</button>
                  <button type="button" disabled={pending} className={buttonClass('danger')} onClick={() => run(`assignments/${assignment.id}/cancel`)}>Cancel</button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canCreate ? (
        <form className="space-y-3 border-t border-line pt-3" onSubmit={submitWith((form) => {
          const dueAt = String(form.get('dueAt') ?? '');
          run(`news/${newsId}/assignments`, {
            assignee: String(form.get('assignee') ?? '').trim(),
            role: String(form.get('role') ?? 'reporter') as (typeof assignmentRoles)[number],
            ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
          });
        })}>
          <Field label="Assignee (sign-in subject)" hint="Enter the person's sign-in subject, as the API uses it.">
            <input name="assignee" required minLength={1} maxLength={200} className={inputClass} />
          </Field>
          <Field label="Role">
            <select name="role" className={inputClass} defaultValue="reporter">
              {assignmentRoles.map((role) => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input name="dueAt" type="datetime-local" className={inputClass} />
          </Field>
          <button type="submit" disabled={pending} className={buttonClass('primary')}>Create assignment</button>
        </form>
      ) : null}
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
    </div>
  );
}
