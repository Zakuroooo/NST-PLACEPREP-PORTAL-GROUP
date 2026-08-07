import type { NextConfig } from "next";

/**
 * Faculty Portal Next.js config.
 * - externalDir: required to import from placeprep-backend (monorepo sibling)
 *
 * LOCAL DEV: Runs on port 3001. Routes served at root path (/).
 * PRODUCTION: Proxied by student portal rewrites at /faculty/*.
 *   The rewrite strips /faculty from the path, so faculty portal still
 *   serves its own routes at root — no basePath needed.
 */

const nextConfig: NextConfig = {
  transpilePackages: ["placeprep-backend"],
};

export default nextConfig;
