import { NextResponse } from 'next/server';

export async function middleware(req) {
  const path = req.nextUrl.pathname;

  // Απλό check — αν δεν υπάρχει το sb-access-token cookie, redirect στο login
  const token = req.cookies.get('sb-access-token')?.value ||
                req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value;

  if (path.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};