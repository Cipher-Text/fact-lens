# syntax=docker/dockerfile:1
# Production image for the public site (fact-lens-web, apps/web). Build from the repository root:
#   docker build -f apps/web/Dockerfile --build-arg FACTLENS_API_URL=https://api.example.org -t factlens-web .
# FACTLENS_API_URL is read at build time: next.config.ts turns it into rewrites() when `next build` runs,
# the site also reads it at run time (lib/api/client.ts, proxy.ts), so set the same value on the running container.

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

# build: source, then the site and the workspace packages it depends on, then the production bundle.
FROM deps AS build
ARG FACTLENS_API_URL=
ENV FACTLENS_API_URL=${FACTLENS_API_URL}
COPY . .
RUN pnpm --filter fact-lens-web... build \
 && pnpm --filter fact-lens-web deploy --prod --config.strict-dep-builds=false /out \
 && cp -r /repo/apps/web/.next /out/.next && cd /out && rm -rf .claude .mcp.json .prettierignore .prettierrc.json .gitignore tests docs playwright.config.ts vitest.config.mts vitest.setup.ts eslint.config.mjs postcss.config.mjs components.json AGENTS.md CLAUDE.md README.md Dockerfile pnpm-lock.yaml pnpm-workspace.yaml tsconfig.tsbuildinfo test-results

# runtime: production dependencies and the Next.js build only, as the node user.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
# npm, corepack and their bundled packages are not needed at run time, and they carry advisories (undici, brace-expansion).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
USER node
EXPOSE 3000
# Liveness probe for the platform (D4). The site answers even when the API is down.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node_modules/.bin/next", "start", "--port", "3000", "--hostname", "0.0.0.0"]
