import type { NextConfig } from "next";

/**
 * Admin Portal Next.js config.
 * - externalDir: required to import from placeprep-backend (monorepo sibling)
 *
 * LOCAL DEV: Runs on port 3002. Routes served at root path (/).
 * PRODUCTION: Proxied by student portal rewrites at /admin/*.
 *   The rewrite strips /admin from the path, so admin portal still
 *   serves its own routes at root — no basePath needed.
 */

const nextConfig: NextConfig = {
  transpilePackages: ["placeprep-backend"],
};

export default nextConfig;
