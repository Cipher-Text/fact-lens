# D1: Dockerfiles for the API, the worker and the public site

Plan: `docs/plans/deployment.md`, task D1. Owner: Codex (not a critical task under CLAUDE.md).

## Goal

Three production images, one per service: `apps/api`, `apps/worker`, `apps/web`. Each is multi-stage, runs as a non-root user, contains only production dependencies and built output, and never contains a `.env` file. Nothing is deployed or pushed by this task. CI changes are task D2, not this one.

## Workspace

Repository root (`fact-lens`), touching only the files listed below. Filter names: `@fact-lens/api`, `@fact-lens/worker`, `fact-lens-web`, plus `@fact-lens/config` and `@fact-lens/contracts` as their build dependencies.

## Files to create

1. `.dockerignore` at the repository root.
2. `apps/api/Dockerfile`
3. `apps/worker/Dockerfile`
4. `apps/web/Dockerfile`

Do not edit any other file. If something outside this list seems to need a change, stop and report it.

## Requirements

### Base image and versions

- Every stage uses `node:24-bookworm-slim` (a Debian slim image, not alpine: `sharp` ships glibc prebuilt binaries). Node 24 is required because the API hashes passwords with `node:crypto` `argon2`, which needs Node 24.7 or later. Pin the tag to a specific patch release (for example `node:24.x.y-bookworm-slim`) if the registry is reachable; otherwise use `node:24-bookworm-slim` and say so in the result file.
- pnpm is exactly `12.9.1`, matching the `packageManager` field in the root `package.json`. Enable it with `corepack enable` and `corepack prepare pnpm@12.9.1 --activate`.
- Install with `pnpm install --frozen-lockfile --config.strict-dep-builds=false`. The flag is required (see CLAUDE.md, "Working on main"). Do not change `pnpm-workspace.yaml`.

### Stages (same shape in each Dockerfile)

1. `deps`: copy only the root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and the `package.json` of every workspace member (every `apps/*`, `packages/*`, `tools/*` directory). Run `pnpm install --frozen-lockfile --config.strict-dep-builds=false`. Doing this before the source is copied keeps the layer cached.
2. `build`: copy the rest of the source. Build the target and its workspace dependencies only, using a recursive filter such as `pnpm --filter @fact-lens/api... build`. Then create the production bundle with `pnpm --filter @fact-lens/api deploy --prod /out`. First check the exact `pnpm deploy` syntax for pnpm 12.9.1 (`pnpm deploy --help`) and use what it accepts. The result must contain a flat package directory with its `package.json`, `node_modules` (production dependencies only, with the workspace packages `@fact-lens/config` and `@fact-lens/contracts` resolved to their built `dist/`), and the built output.
3. `runtime`: start again from `node:24-bookworm-slim`. Set `NODE_ENV=production`. Copy only `/out` from the build stage. Run as the non-root `node` user (uid 1000), with `USER node`. Set `WORKDIR` to the app directory. Use the start command from the package (`node dist/main.js` for api and worker; `next start` for web). No `pnpm` and no build tools in the runtime image.

### Per service

- **api** (`apps/api/Dockerfile`): `EXPOSE 4000`. Its `dist/` must run with `node dist/main.js`. The SQL migrations in `apps/api/migrations` and `seed-data/` must be present in the final image, because D5 runs the migrations from this image as a release step. Check this with `ls` in the image. `node-pg-migrate` is a dependency of the API, so it is in `/out`. Do not copy the seed (`src/seed`) or `tsx`; they are dev-only.
- **worker** (`apps/worker/Dockerfile`): `EXPOSE 4100` (the health port default in `.env.example`; check the actual `WORKER_HEALTH_PORT` default there and use it). The card renderer reads fonts with `join(__dirname, '../../assets/fonts')` from `apps/worker/src/cards/compose.ts`. In the compiled output that resolves to `<app>/assets/fonts`, so `apps/worker/assets/` must be present at the same relative location in the final image. Check the fonts are in the image.
- **web** (`apps/web/Dockerfile`): `EXPOSE 3000`. `next.config.ts` builds its `rewrites()` from `FACTLENS_API_URL` at build time (`mediaRewrites` in `src/lib/api/media-rewrite.ts`). Therefore accept it as a build argument: `ARG FACTLENS_API_URL=` and set it as an environment variable in the build stage only, not in the runtime image. Leave it empty by default. Also check whether `PUBLIC_SITE_URL` or any other value is read at build time and report it. Run `next build` in the build stage. Next.js has no `output: "standalone"` setting in this repository, so the runtime uses `next start` from `/out`. Do not change `next.config.ts` to add standalone output in this task.

### `.dockerignore`

Exclude at least: `.git`, every `.env` and `.env.*` file except `.env.example` (use `**/.env` and `**/.env.*`, then `!**/.env.example`), `**/node_modules`, `**/dist`, `**/.next`, `**/*.tsbuildinfo`, `**/coverage`, `**/.turbo`, `.data`, `.run`, `docs`, `**/test-results`, `**/playwright-report`, `**/.DS_Store`, `infrastructure`, `cipher-press`. Leave the source in `apps/`, `packages/`, `tools/`, the lockfile and the workspace files.

## What NOT to touch

- Source code under `apps/*/src`, `packages/*`, `tools/*`.
- Migrations and seed data (read them, do not change them).
- `.github/workflows/*` (task D2).
- `pnpm-workspace.yaml`, `package.json` files, `pnpm-lock.yaml`.
- `.env`, `.env.example`, `packages/config`.
- `apps/web/docs/`.
- `apps/web/next.config.ts`.

## Acceptance criteria

1. `docker build -f apps/api/Dockerfile -t factlens-api:d1 .`, the same for `apps/worker` and `apps/web`, all succeed from the repository root.
2. No `.env` file is in any image: `docker run --rm --entrypoint sh factlens-api:d1 -c 'find / -xdev \( -name ".env" -o -name ".env.*" \) 2>/dev/null'` prints nothing (`.env.example` excepted, but it should not be there either). Run the same for the other two images.
3. Each image runs as uid 1000: `docker run --rm --entrypoint id factlens-api:d1 -u` prints `1000`.
4. Production only: `docker run --rm --entrypoint sh factlens-api:d1 -c 'ls node_modules | grep -E "^(typescript|vitest|tsx|@swc|unplugin-swc)$"'` prints nothing. Same for the worker and web (web: check `typescript` and `@playwright/test` are absent).
5. The API image contains `migrations/` with the `.sql`/`.js` migration files that `apps/api/migrations` has in the repository.
6. The worker image contains `assets/fonts/NotoSansBengali-Regular.ttf`.
7. Starting without configuration fails clearly. `docker run --rm factlens-api:d1` and `docker run --rm factlens-worker:d1` exit non-zero, and their log names a missing or invalid setting from `packages/config` (not a crash with a stack trace from a missing module). Report the actual message.
8. `docker run --rm -e NODE_ENV=production factlens-web:d1` is not required to work without a backend, but it must not fail at build time. Report what it prints.

## Verification

Run from the repository root:

```bash
pnpm check          # must still pass; the Dockerfiles do not change the JS workspace
docker build -f apps/api/Dockerfile -t factlens-api:d1 .
docker build -f apps/worker/Dockerfile -t factlens-worker:d1 .
docker build -f apps/web/Dockerfile -t factlens-web:d1 .
```

Then run the acceptance checks above. Do not run `./run.sh` or any dev server, and do not start the containers against the local PostgreSQL. Do not push images.

## Result file

Write your final message to `docs/plans/deployment/results/D1.txt`. In it, list:
- the exact `pnpm deploy` command used and what the output contained;
- the base image tag and whether a digest pin was possible;
- each acceptance check with its actual output;
- every file created, with a line count;
- anything you could not verify, and anything in the repository that looked wrong while you worked (especially anything that contradicts `docs/plans/deployment.md`).
