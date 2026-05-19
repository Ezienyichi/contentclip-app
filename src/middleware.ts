import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = [
  '/',
  '/auth',
  '/about',
  '/pricing',
  '/legal',
  '/api/auth',
  '/api/auth/callback',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Protected routes — pass through (session is validated server-side via Supabase)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
