# T1: assignment panel on the news item page

Owner: Codex (normal execution). Wave 1. Plan: [../assignment-and-source-screens.md](../assignment-and-source-screens.md).

## Goal

On the news item page, the "Assignments" panel lets an editor create an assignment, and lets the assignee complete it or anyone with rights cancel it. Today the panel is read-only.

## Workspace

`@fact-lens/newsroom` (`apps/newsroom`). No API, contracts or migration changes.

## Files

Create:
- `apps/newsroom/src/components/AssignmentParts.tsx`: the create form and the per-row complete and cancel buttons. Client component (`'use client'`).
- `apps/newsroom/src/components/AssignmentParts.test.tsx` or `apps/newsroom/src/lib/assignments.test.ts`, depending on what is testable. Put any pure logic (for example role labels or the due-date conversion) in `apps/newsroom/src/lib/assignments.ts` and test that.

Edit:
- `apps/newsroom/src/app/(app)/news/[id]/page.tsx`: only the "Assignments" `Panel` (around lines 216 to 221). Replace the read-only list with the new component. Leave the other panels alone.

Do not edit anything else.

## Interfaces and types (from `@fact-lens/contracts`, do not redefine)

- `assignmentCreateSchema`: `{ assignee: string (1 to 200), role: 'reporter' | 'editor' | 'copy_editor' | 'fact_checker' | 'translator', dueAt?: timestamp }`
- `assignmentSchema`, `Assignment` type: has `id`, `role`, `assignee`, `status` (`open`, `done`, `cancelled`), `dueAt`.
- `assignmentRoles`, `assignmentStatuses` enums.

## Behaviour

- Create: `bff('POST', \`news/${newsId}/assignments\`, body)`. Use the `useCommand` pattern in `InboxParts.tsx` (`run`, `pending`, `error`, `router.refresh()`). Form submit uses `onSubmit` with `submitWith` from `@/lib/form`, not form `action`, so a failed save keeps what was typed.
- Complete: `bff('POST', \`assignments/${id}/complete\`)`. Show only when `status === 'open'`.
- Cancel: `bff('POST', \`assignments/${id}/cancel\`)`. Show only when `status === 'open'`.
- Show the API's error message and `issues` through `Notice`. If the API returns `reason === 'mfa_required'`, use the same wording as `InboxParts.tsx`.
- Assignee input: a plain text field labelled "Assignee (sign-in subject)" with a hint: the person's sign-in subject, as the API uses it. This is decision 1, option A.
- Role labels: show `role.replace('_', ' ')` as the existing read-only panel does, or a small label map in `assignments.ts`.
- Due date: a `datetime-local` input. Convert to an ISO timestamp with `new Date(value).toISOString()` before sending. Leave it out when empty.
- One open assignment per person and role is enforced by the API. Show the API's message; do not check it in the UI.
- Hide the create form when the person lacks `news.edit`, using `can(principal, 'news.edit')` from `@/lib/nav`. This is a convenience only; the API enforces.

## Styling

- Colours only from the CSS variables in `apps/newsroom/src/app/globals.css`, or Tailwind `dark:` classes. No hard-coded colours, no `@media (prefers-color-scheme)`.
- Use the primitives in `apps/newsroom/src/components/ui.tsx`: `buttonClass`, `inputClass`, `Field`, `Notice`, `Badge`, `Empty`.

## What NOT to touch

- Sources panel, comments panel, timeline and everything else on the page.
- `apps/api/**`, `packages/**`, `apps/newsroom/src/lib/editor/**`.
- Any migration, any `.env` file.

## Acceptance criteria

1. The Assignments panel lists open and closed assignments as before.
2. An editor with `news.edit` can create an assignment with assignee, role and optional due date. The list refreshes after save.
3. Complete and cancel buttons appear only on open assignments, and call the endpoints above.
4. A failed save shows the API message and keeps the typed values.
5. Nothing is hard-coded in a colour; the component renders in light and dark.
6. No new `any`; all types come from the contracts package.

## Verification

```bash
pnpm --filter @fact-lens/newsroom typecheck
pnpm --filter @fact-lens/newsroom lint
pnpm --filter @fact-lens/newsroom test
```

Report the output of all three. Do not start dev servers and do not run `./run.sh`.
