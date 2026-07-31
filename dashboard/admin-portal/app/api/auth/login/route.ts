/**
 * dashboard/admin-portal/app/api/auth/login/route.ts
 * POST /api/auth/login — admin-portal-owned login endpoint.
 *
 * Previously the login page called the Student Portal's /api/auth/login,
 * meaning admin login failed entirely if the Student Portal dev server was not
 * running. This route hosts the same logic directly inside the Admin Portal so
 * it is fully self-contained.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from 'placeprep-backend/src/config/db';
import { authService } from 'placeprep-backend/src/services/auth.service';
import { loginSchema } from 'placeprep-backend/src/validators/auth.validator';
import { successResponse } from 'placeprep-backend/src/utils/apiResponse';
import { ApiError, handleApiError } from 'placeprep-backend/src/utils/apiError';
import { TOKEN_COOKIE_NAME } from 'placeprep-backend/src/utils/authMiddleware';
import { checkRateLimit, getClientIp, RATE_LIMITS } from 'placeprep-backend/src/utils/rateLimiter';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit — 5 attempts per 15 min per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`admin_login:${ip}`, RATE_LIMITS.LOGIN);
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
        },
      }
    );
  }

  // Payload size guard
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

    // Enforce admin-only access at the API level
    if (result.role !== 'admin') {
      throw ApiError.forbidden('Access denied. This portal is for administrators only.');
    }

    const response = successResponse(
      { role: result.role, userId: result.userId, name: result.name },
      { message: 'Login successful' }
    );

    response.cookies.set(`${TOKEN_COOKIE_NAME}_${result.role}`, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
