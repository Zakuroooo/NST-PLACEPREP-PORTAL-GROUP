import type { NextConfig } from "next";

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_STUDENT_URL || "http://localhost:3000",
  process.env.NEXT_PUBLIC_FACULTY_URL || "http://localhost:3001",
  process.env.NEXT_PUBLIC_ADMIN_URL   || "http://localhost:3002",
]);

const nextConfig: NextConfig = {
  transpilePackages: ["placeprep-backend"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          // NOTE: For credentialed requests, Access-Control-Allow-Origin must be
          // a single exact origin, not a comma-joined list. We dynamically match
          // per-request via middleware instead — these headers are fallback defaults.
          { key: "Access-Control-Allow-Origin",      value: process.env.NEXT_PUBLIC_STUDENT_URL || "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods",     value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers",     value: "Content-Type, Authorization, Cookie" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
  async rewrites() {
    return [];
  },
};

// Export allowed origins set for use in middleware
export { ALLOWED_ORIGINS };
export default nextConfig;
