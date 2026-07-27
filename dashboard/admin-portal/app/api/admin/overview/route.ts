/**
 * dashboard/admin-portal/app/api/admin/overview/route.ts
 * GET /api/admin/overview — platform-wide KPIs.
 *
 * Architecture: Route → Service → Repository → DB
 *
 * PERF: Real-time request counter tracks actual admin API hit rate per minute.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { requireAdmin } from 'placeprep-backend/src/utils/authMiddleware';
import { adminService } from 'placeprep-backend/src/services/admin.service';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { handleApiError } from 'placeprep-backend/src/utils/apiError';

// ── Real-time request counter (sliding 60-second window) ──────────────────────
// Tracks timestamps of all admin API hits. On each overview fetch,
// we count how many hits fall within the last 60 seconds.
const requestTimestamps: number[] = [];
const REQ_WINDOW_MS = 60_000; // 1 minute window

/** Call this from every admin API route to track real req/min */
export function recordAdminRequest(): void {
  const now = Date.now();
  requestTimestamps.push(now);
  // Prune entries older than 1 minute to prevent unbounded growth
  const cutoff = now - REQ_WINDOW_MS;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }
}

/** Returns current requests-per-minute count from the sliding window */
export function getRequestsPerMinute(): number {
  const cutoff = Date.now() - REQ_WINDOW_MS;
  // Count only timestamps within the last minute
  return requestTimestamps.filter((t) => t >= cutoff).length;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  recordAdminRequest(); // Count this request
  try {
    await connectDB();
    await requireAdmin(request);
    const data = await adminService.getOverview();
    // Inject real request rate into the response
    return successResponse({
      ...data,
      stats: {
        ...data.stats,
        requestsPerMinute: getRequestsPerMinute(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
