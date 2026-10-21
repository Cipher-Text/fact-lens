import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// One .env for the whole repository, at the workspace root. Next only looks in this app's folder,
// and has usually read it already by the time this file runs, so the reload is forced. Variables
// already set in the environment (a deployment) always win over the file.
function workspaceRoot(from: string): string {
  for (let dir = from; ; dir = dirname(dir)) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    if (dirname(dir) === dir) return from;
  }
}
loadEnvConfig(workspaceRoot(process.cwd()), process.env.NODE_ENV !== 'production', console, true);

const nextConfig: NextConfig = {
  // The newsroom is an internal tool: it must never be framed, indexed or sniffed.
  poweredByHeader: false,
  // Stop `next dev` from writing AGENTS.md and CLAUDE.md into this folder. Agent rules live at the repository root.
  agentRules: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
