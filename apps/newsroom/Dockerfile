# syntax=docker/dockerfile:1
# Production image for the newsroom (@fact-lens/newsroom). Build from the repository root:
#   docker build -f apps/newsroom/Dockerfile -t factlens-newsroom .
# Secrets are not baked in: SESSION_SECRET, API_BASE_URL and the rest come from the platform at run time.

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

# build: source, then the newsroom and the workspace packages it depends on, then the production bundle.
FROM deps AS build
COPY . .
RUN pnpm --filter @fact-lens/newsroom... build \
 && pnpm --filter @fact-lens/newsroom deploy --prod --config.strict-dep-builds=false /out \
 && cp -r /repo/apps/newsroom/.next /out/.next \
 && cd /out && rm -rf Dockerfile pnpm-lock.yaml pnpm-workspace.yaml .claude .mcp.json

# runtime: production dependencies and the Next.js build only, as the node user.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# npm, corepack and their bundled packages are not needed at run time, and they carry advisories (undici, brace-expansion).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
USER node
EXPOSE 3100
# Liveness probe for the platform (D4, D6). It runs inside the container and does not call the API.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3100/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node_modules/.bin/next", "start", "--port", "3100", "--hostname", "0.0.0.0"]
