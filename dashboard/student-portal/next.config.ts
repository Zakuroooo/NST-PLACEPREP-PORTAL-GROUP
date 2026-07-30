import type { NextConfig } from "next";

/**
 * Student Portal Next.js config.
 * - CORS headers: restrict API routes to same-origin + allowed portals
 * - Body size limit enforced via Content-Length header in route handlers
 */

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_STUDENT_URL || 'http://localhost:3000',
  process.env.NEXT_PUBLIC_FACULTY_URL || 'http://localhost:3001',
  process.env.NEXT_PUBLIC_ADMIN_URL   || 'http://localhost:3002',
].filter(Boolean);

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["placeprep-backend"],
};

export default nextConfig;
