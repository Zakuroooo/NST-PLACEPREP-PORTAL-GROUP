/**
 * dashboard/student-portal/middleware.ts
 * JWT cookie middleware — replaced Clerk with custom placeprep_token validation.
 * Edge-safe: uses jose for JWT verification (no Node.js runtime needed).
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = new Set(['/', '/login', '/api/auth/login', '/api/auth/logout']);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'placeprep_fallback_secret_change_in_prod'
);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow static assets, Next.js internals, and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth/login');
  const token = request.cookies.get('placeprep_token_student')?.value || request.cookies.get('placeprep_token')?.value;

  // Default response (might be modified by auth checks)
  let response = NextResponse.next();

  // Validate JWT for protected routes
  if (!isPublic) {
    if (!token) {
      response = NextResponse.redirect(new URL('/login', request.url));
    } else {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        // This is the student portal — only students allowed
        if (payload.role !== 'student') {
          response = NextResponse.redirect(new URL('/login', request.url));
          response.cookies.set('placeprep_token_student', '', { maxAge: 0, path: '/' });
          response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
        }
      } catch {
        response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('placeprep_token_student', '', { maxAge: 0, path: '/' });
        response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
      }
    }
  }

  // Already logged in — don't let back to login
  if (isPublic && pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === 'student') {
        response = NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Token invalid — allow login page
    }
  }

  // Secure dynamic CORS for cross-portal API calls (like Faculty login)
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_STUDENT_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_FACULTY_URL || 'http://localhost:3001',
    process.env.NEXT_PUBLIC_ADMIN_URL   || 'http://localhost:3002',
    'http://192.168.0.127:3000',
    'http://192.168.0.127:3001',
    'http://192.168.0.127:3002'
  ];

  if (pathname.startsWith('/api') && origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
