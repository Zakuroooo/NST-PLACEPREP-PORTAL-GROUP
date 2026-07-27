/**
 * dashboard/faculty-portal/middleware.ts
 * JWT cookie middleware for faculty portal — only 'faculty' role tokens allowed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api/auth'];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'placeprep_fallback_secret_change_in_prod'
);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = request.cookies.get('placeprep_token_faculty')?.value || request.cookies.get('placeprep_token')?.value;

  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (payload.role !== 'faculty') {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('placeprep_token_faculty', '', { maxAge: 0, path: '/' });
        response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
        return response;
      }
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('placeprep_token_faculty', '', { maxAge: 0, path: '/' });
      response.cookies.set('placeprep_token', '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  if (pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === 'faculty') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Invalid token — stay on login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
