/**
 * dashboard/student-portal/app/api/auth/login/route.ts
 * POST /api/auth/login — unified login for all three portals.
 * Student portal hosts this endpoint; faculty and admin login pages point here.
 *
 * Security:
 * - Rate limited: 5 attempts per 15 minutes per IP (brute-force protection)
 * - Payload size guard: rejects bodies over 1 KB
 * - Generic error message: prevents user enumeration
 * - HTTP-only cookie: prevents XSS token theft
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { authService } from 'placeprep-backend/src/services/auth.service';
import { loginSchema } from 'placeprep-backend/src/validators/auth.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { ApiError, handleApiError } from 'placeprep-backend/src/utils/apiError';
import { TOKEN_COOKIE_NAME } from 'placeprep-backend/src/utils/authMiddleware';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from 'placeprep-backend/src/utils/rateLimiter';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Rate limit — 5 attempts per 15 min per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`login:${ip}`, RATE_LIMITS.LOGIN);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many login attempts. Please wait 15 minutes before trying again.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rl.resetAt),
        },
      }
    );
  }

  // 2. Payload size guard — reject bodies over 1 KB
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024) {
    return NextResponse.json(
      { success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large.' } },
      { status: 413 }
    );
  }

  try {
    await connectDB();

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      throw ApiError.badRequest('Invalid input.', validation.error.flatten().fieldErrors);
    }

    const { email, password } = validation.data;
    const result = await authService.login(email, password);

    // Override redirectUrl here using THIS portal's own env vars.
    // This is more reliable than the shared backend service resolving env vars.
    const PORTAL_URLS: Record<string, string> = {
      student: process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || 'https://nst-prep-portal-by-pranay-student-p.vercel.app',
      faculty: process.env.NEXT_PUBLIC_FACULTY_PORTAL_URL || 'https://nst-prep-portal-by-pranay-faculty-portal-aanchv5wk.vercel.app',
      admin:   process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL   || 'https://nst-prep-portal-by-pranay-admin-portal-fpdq0kwf2.vercel.app',
    };
    const redirectUrl = PORTAL_URLS[result.role] || PORTAL_URLS.student;

    const response = successResponse(
      {
        role: result.role,
        userId: result.userId,
        name: result.name,
        redirectUrl,
        token: result.token, // Needed for cross-origin portal cookie handoff
      },
      { message: 'Login successful' }
    );

    // Set HTTP-only cookie — 7 days
    response.cookies.set(`${TOKEN_COOKIE_NAME}_${result.role}`, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
