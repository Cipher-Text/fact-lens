# syntax=docker/dockerfile:1
# Production image for the API (@fact-lens/api). Build from the repository root:
#   docker build -f apps/api/Dockerfile -t factlens-api .
# Node 24.7+ is required: password hashing uses node:crypto argon2.

ARG NODE_IMAGE=node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530

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

# build: source, then the API and the workspace packages it depends on, then the production bundle.
FROM deps AS build
COPY . .
RUN pnpm --filter @fact-lens/api... build \
 && pnpm --filter @fact-lens/api deploy --prod --config.strict-dep-builds=false /out \
 && cd /out && rm -rf src tsconfig.json tsconfig.build.json vitest.config.mts Dockerfile pnpm-lock.yaml pnpm-workspace.yaml .data

# runtime: production dependencies and built output only, as the unprivileged node user.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# npm, corepack and their bundled packages are not needed at run time, and they carry advisories (undici, brace-expansion).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
USER node
EXPOSE 4000
# Liveness probe for the platform (D4). Runs inside the container, so it reaches the loopback address.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.API_PORT || 4000) + '/health/live').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "dist/main.js"]
