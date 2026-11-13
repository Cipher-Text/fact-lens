# T2: source panel on the news item page

Owner: Codex (normal execution). Wave 2, after T1 is merged. Plan: [../assignment-and-source-screens.md](../assignment-and-source-screens.md).

## Goal

The "Sources" panel on the news item page lets an editor create a source, attach a source to the news item, detach it, and validate it (accept or reject with a reason). Today the panel is read-only.

## Workspace

`@fact-lens/newsroom` (`apps/newsroom`). No API, contracts or migration changes.

## Files

Create:
- `apps/newsroom/src/components/SourceParts.tsx`: the create form, the attach form, and per-row detach and validate controls. Client component (`'use client'`).
- `apps/newsroom/src/lib/sources.ts`: any pure logic (for example: build the attach body, or the validation reason check), with `apps/newsroom/src/lib/sources.test.ts`.

Edit:
- `apps/newsroom/src/app/(app)/news/[id]/page.tsx`: only the "Sources" `Panel` (around lines 203 to 214). Replace the read-only list with the new component. Leave the other panels alone.

Do not edit anything else.

## Interfaces and types (from `@fact-lens/contracts`, do not redefine)

- `sourceCreateSchema` (strict): `kind` (default `web`), `title` (1 to 500), `publisher?`, `url?`, `canonicalUrl?`, `archiveUrl?`, `publishedAt?`, `retrievedAt?`, `notes?`. Use `sourceKinds` for the kind select.
- `sourceValidationSchema`: `{ status: 'valid' | 'rejected', reason: string (3 to 500) }`.
- `newsSourceAttachSchema`: `{ relation: 'primary' | 'secondary' (default primary), useType: 'quoted' | 'background' | 'data' | 'media' | 'attribution' (default background), notes?: string (max 2000) }`.
- `attachedSourceSchema`, `AttachedSource` type: the source fields plus `relation`, `useType`, `notes`. Has `validationStatus` (`unvalidated`, `valid`, `rejected`).
- Enums: `sourceKinds`, `sourceRelations`, `sourceUseTypes`, `sourceValidationStatuses`.

## Endpoints

- Create a source: `bff('POST', 'sources', body)`. Returns the source with its `id`. The API deduplicates by canonical URL and returns the existing source if one matches.
- Attach: `bff('PUT', \`news/${newsId}/sources/${sourceId}\`, attachBody)`.
- Detach: `bff('DELETE', \`news/${newsId}/sources/${sourceId}\`)`.
- Validate: `bff('POST', \`sources/${sourceId}/validation\`, { status, reason })`.

## Behaviour

- Use the `useCommand` pattern in `InboxParts.tsx`. Forms use `onSubmit` with `submitWith` from `@/lib/form`, so a failed save keeps what was typed.
- Create then attach: the form creates the source and then attaches it in one action. If the create succeeds and the attach fails, show the attach error and keep the created source visible, so the editor can attach it again without creating a duplicate.
- Attach notes are internal. Show a short line: "Notes are internal and are not published." Do not render attach notes anywhere public.
- Validate: two buttons, "Accept" and "Reject". "Reject" needs a reason (3 to 500 characters) entered first. Show the validation controls only when the source is `unvalidated`, or when the person may change it. Do not guess the capability in the UI beyond `can(principal, 'news.review')` for showing the controls; the API enforces the rule and its message is shown when it refuses.
- Show `validationStatus` with `Badge` as the read-only panel already does.
- Hide the create and attach forms when the person lacks `news.edit`, using `can(principal, 'news.edit')` from `@/lib/nav`. This is a convenience only.
- Show API errors and `issues` through `Notice`. If `reason === 'mfa_required'`, use the same wording as `InboxParts.tsx`.

## Styling

- Colours only from the CSS variables in `apps/newsroom/src/app/globals.css`, or Tailwind `dark:` classes. No hard-coded colours.
- Use the primitives in `apps/newsroom/src/components/ui.tsx`.

## What NOT to touch

- Assignments panel (done in T1), comments, timeline and everything else on the page.
- `apps/api/**`, `packages/**`, `apps/newsroom/src/lib/editor/**`, `apps/newsroom/src/components/InboxParts.tsx` and `NewsCreate.tsx` (the inbox "use" flow stays as it is).
- Any migration, any `.env` file.

## Acceptance criteria

1. The Sources panel lists attached sources with their validation badge, as before.
2. An editor with `news.edit` can create a source and attach it with relation and use type. The list refreshes after save.
3. Detach removes the link and refreshes the list.
4. Validate (accept or reject with reason) works for a person who may review; a rejected source's reason is required in the UI.
5. A failed create-then-attach keeps the created source, and no duplicate is made on retry.
6. Attach notes are labelled as internal.
7. Light and dark both work through the CSS variables.

## Verification

```bash
pnpm --filter @fact-lens/newsroom typecheck
pnpm --filter @fact-lens/newsroom lint
pnpm --filter @fact-lens/newsroom test
```

Report the output of all three. Do not start dev servers and do not run `./run.sh`.
