import type { NextConfig } from "next";

/**
 * Admin Portal Next.js config.
 * - basePath: '/admin' — all routes served under /admin prefix.
 *   This pairs with the student-portal rewrite rule that proxies /admin/* here.
 * - externalDir: required to import from placeprep-backend (monorepo sibling)
 *
 * In production on Vercel, this app is deployed standalone but accessed via
 * the main student portal domain at /admin/*.
 */

const nextConfig: NextConfig = {
  basePath: "/admin",
  transpilePackages: ["placeprep-backend"],
  async rewrites() {
    return [];
  },
};

export default nextConfig;
