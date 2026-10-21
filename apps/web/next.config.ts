import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stop `next dev` from writing its agent block into AGENTS.md and CLAUDE.md.
  // Those files come from the project kit and must not change.
  agentRules: false,
};

export default nextConfig;
