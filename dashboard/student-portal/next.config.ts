import type { NextConfig } from "next";

/**
 * Student Portal Next.js config.
 * - Path-based routing: /faculty/* and /admin/* are rewritten to their
 *   respective Vercel deployments, making this the single entry-point domain.
 * - externalDir: required to import from placeprep-backend (monorepo sibling)
 *
 * ENV VARS required in Vercel for production:
 *   NEXT_PUBLIC_FACULTY_URL  — e.g. https://faculty-portal-xyz.vercel.app
 *   NEXT_PUBLIC_ADMIN_URL    — e.g. https://admin-portal-xyz.vercel.app
 */

const FACULTY_URL = process.env.NEXT_PUBLIC_FACULTY_URL || "http://localhost:3001";
const ADMIN_URL   = process.env.NEXT_PUBLIC_ADMIN_URL   || "http://localhost:3002";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["placeprep-backend"],
  async rewrites() {
    return [
      // Proxy /faculty and all sub-paths to the Faculty Portal
      {
        source: "/faculty",
        destination: `${FACULTY_URL}/faculty`,
      },
      {
        source: "/faculty/:path*",
        destination: `${FACULTY_URL}/faculty/:path*`,
      },
      // Proxy /admin and all sub-paths to the Admin Portal
      {
        source: "/admin",
        destination: `${ADMIN_URL}/admin`,
      },
      {
        source: "/admin/:path*",
        destination: `${ADMIN_URL}/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
