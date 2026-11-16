import type { NextConfig } from "next";
import { mediaRewrites } from "./src/lib/api/media-rewrite";

const nextConfig: NextConfig = {
  // Stop `next dev` from writing its agent block into AGENTS.md and CLAUDE.md.
  // Those files come from the project kit and must not change.
  agentRules: false,
  async rewrites() {
    return mediaRewrites(process.env.FACTLENS_API_URL?.trim() || null);
  },
};

export default nextConfig;
