import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-checking is enforced as its own CI gate (`pnpm -r typecheck`, see
  // docs/12-testing-strategy.md). Next's build re-runs it, which on some
  // machines takes tens of minutes of redundant work — skip it here so
  // `build` only bundles. (Next 16 no longer runs ESLint on build.)
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
