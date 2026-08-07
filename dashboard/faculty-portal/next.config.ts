import type { NextConfig } from "next";

/**
 * Faculty Portal Next.js config.
 * - basePath: '/faculty' — all routes served under /faculty prefix.
 *   This pairs with the student-portal rewrite rule that proxies /faculty/* here.
 * - externalDir: required to import from placeprep-backend (monorepo sibling)
 *
 * In production on Vercel, this app is deployed standalone but accessed via
 * the main student portal domain at /faculty/*.
 */

const nextConfig: NextConfig = {
  basePath: "/faculty",
  transpilePackages: ["placeprep-backend"],
  async rewrites() {
    return [];
  },
};

export default nextConfig;
