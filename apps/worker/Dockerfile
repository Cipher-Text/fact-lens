# syntax=docker/dockerfile:1
# Production image for the worker (@fact-lens/worker). Build from the repository root:
#   docker build -f apps/worker/Dockerfile -t factlens-worker .

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable && corepack prepare pnpm@12.9.1 --activate
WORKDIR /repo

# deps: manifests only, so the install layer is cached until a dependency changes.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
COPY apps/newsroom/package.json apps/newsroom/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY tools/dev-idp/package.json tools/dev-idp/
RUN pnpm install --frozen-lockfile --config.strict-dep-builds=false

# build: source, then the worker and the workspace packages it depends on, then the production bundle.
FROM deps AS build
COPY . .
RUN pnpm --filter @fact-lens/worker... build \
 && pnpm --filter @fact-lens/worker deploy --prod --config.strict-dep-builds=false /out \
 && cd /out && rm -rf src tsconfig.json tsconfig.build.json vitest.config.mts Dockerfile pnpm-lock.yaml pnpm-workspace.yaml .data

# runtime: production dependencies, built output and the card fonts (assets/), as the node user.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4100
CMD ["node", "dist/main.js"]
