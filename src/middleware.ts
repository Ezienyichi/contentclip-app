import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ADMIN_EMAILS } from '@/lib/adminEmails';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always run the Supabase session refresh so that API route handlers receive
  // a valid (possibly just-refreshed) access token in their cookies, regardless
  // of which page the request originates from (including public pages like /pricing).
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — writes updated cookies if the token was rotated.
  const { data: { user } } = await supabase.auth.getUser();

  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth?next=/admin', request.url));
    }
    if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
