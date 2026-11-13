# T2: deterministic card compositor in the worker

Owner: Codex (normal execution). Wave 1, in parallel with T1. Needs T0 merged. Plan: [../card-generation.md](../card-generation.md). Reads: [docs/10](../../10-media-architecture.md) ("Branded cards and posters"), [docs/17](../../17-architecture-decisions.md) ADR-010 (deterministic compositing, not generative AI).

## Goal

A pure function that takes a template spec, a source photo, a crop, and text, and returns WebP bytes. No database, no network, no storage.

## Workspace

`@fact-lens/worker` (`apps/worker`).

## Preliminary check (do first, report it)

The root `pnpm-workspace.yaml` lists `sharp: false` under `allowBuilds`. Confirm that sharp works in the worker's install (`node -e "require('sharp')"` in the worktree). If it needs its native build, stop and report. Do not change `pnpm-workspace.yaml`; that is a repo-config change for the lead.

## Files

- Edit `apps/worker/package.json`: add `sharp` with the same version the API uses (`apps/api/package.json`). Run `pnpm install --config.strict-dep-builds=false` in the worktree.
- Create `apps/worker/src/cards/compose.ts`:
  - `export async function composeCard(input: ComposeInput): Promise<Buffer>`
  - `ComposeInput`: `{ width, height, spec, photo: Buffer, crop: {x,y,width,height}, headline: string, byline?: string }`.
  - Steps: crop the photo to the aspect ratio, resize to `width` x `height`, draw the gradient and frame from `spec`, draw the headline and byline into their regions, return WebP.
  - Text rendering uses fonts from `apps/worker/assets/fonts/` only (see the font risk in the plan). If the font files are not yet in the repo, stop and report.
- Create `apps/worker/src/cards/compose.test.ts` with a small fixture JPEG and PNG in `apps/worker/src/cards/fixtures/`.

## Rules

- Pure: no `fs` reads except the bundled fonts, no network.
- Deterministic: the same input gives byte-identical output. Test this.
- Reject a crop outside 0 to 1, a non-positive size, or a headline longer than 300 characters.
- Refuse an input that is not a decodable image.

## Do NOT touch

`apps/api/**`, `packages/**`, the worker's job or outbox code (T3), `pnpm-workspace.yaml`, any `.env` file.

## Acceptance

1. Output is WebP with the requested width and height.
2. Same input, same bytes (tested by rendering twice).
3. A crop of 0.5 by 0.5 from a 1000 by 1000 fixture gives the expected crop size.
4. Headline text is inside the headline region as defined by `spec` (test the region bounds, not pixels).
5. Bad crop, empty image and oversize headline are each rejected with a clear error.

## Verification

```bash
pnpm --filter @fact-lens/worker typecheck
pnpm --filter @fact-lens/worker lint
pnpm --filter @fact-lens/worker test
```

Report the output of all three, and the sharp check result.
