import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge middleware that gates /dashboard routes. Checks for either the HTTP or HTTPS
// NextAuth session cookie — the __Secure- prefix is used in production (HTTPS).
// This is a fast presence check only; JWT validity is verified by NextAuth on each API call.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/dashboard')) {
    const token =
      request.cookies.get('next-auth.session-token') ??
      request.cookies.get('__Secure-next-auth.session-token');
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
