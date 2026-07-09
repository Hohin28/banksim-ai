import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-checking and linting are enforced as their own CI gates
  // (`pnpm -r typecheck` and `pnpm -r lint`, see docs/12-testing-strategy.md).
  // Next's build re-runs both, which on some machines takes tens of minutes
  // of redundant work — skip them here so `build` only bundles.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
