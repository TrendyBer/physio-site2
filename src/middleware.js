import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value; },
        set(name, value, options) { res.cookies.set({ name, value, ...options }); },
        remove(name, options) { res.cookies.set({ name, value: '', ...options }); },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    const { data: profile } = await supabase
      .from('user_profiles').select('role').eq('id', session.user.id).single();

    if (path.startsWith('/dashboard/therapist') && profile?.role !== 'therapist')
      return NextResponse.redirect(new URL('/', req.url));
    if (path.startsWith('/dashboard/patient') && profile?.role !== 'patient')
      return NextResponse.redirect(new URL('/', req.url));
  }

  if (path.startsWith('/auth') && session) {
    const { data: profile } = await supabase
      .from('user_profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role === 'therapist') return NextResponse.redirect(new URL('/dashboard/therapist', req.url));
    if (profile?.role === 'patient') return NextResponse.redirect(new URL('/dashboard/patient', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};