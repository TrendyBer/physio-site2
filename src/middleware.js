import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Protected routes
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Role check
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (path.startsWith('/dashboard/therapist') && profile?.role !== 'therapist') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (path.startsWith('/dashboard/patient') && profile?.role !== 'patient') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (path.startsWith('/auth') && session) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'therapist') return NextResponse.redirect(new URL('/dashboard/therapist', req.url));
    if (profile?.role === 'patient') return NextResponse.redirect(new URL('/dashboard/patient', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};