# T3: record the decision

Owner: Claude (docs). Runs after T2 is merged. Plan: [../card-duplicate-renders.md](../card-duplicate-renders.md).

## Goal

Keep the docs true after the migration and the upload change.

## Files

- `docs/17-architecture-decisions.md`: add ADR-036 after ADR-035, using the same format. Content: a card output's checksum is not unique; the unique index is partial and exempts card outputs; uploads never dedupe against card outputs; the down step refuses rather than deletes.
- `docs/19-open-questions.md`: mark question 29 as resolved, with a link to ADR-036 (keep the existing wording, add "Resolved:" as the file does for question 1 and others).
- `docs/10-media-architecture.md`: in the "Built" paragraph, replace the open-question sentence with the resolution.
- `docs/22-implementation-status.md`: under the card line in the API surface and in "Not built" if it lists this, remove the open item.
- `docs/plans/README.md` and this plan's status table: mark done.

## Do NOT touch

Code, migrations, and other docs.

## Verification

Relative links in the changed docs resolve (same check as the last docs sync).
