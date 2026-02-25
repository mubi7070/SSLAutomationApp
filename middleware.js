import { NextResponse } from 'next/server';

export function middleware(req) {
  // Check if the secure session cookie exists
  const session = req.cookies.get('sessionToken');
  const { pathname } = req.nextUrl;

  // Allow access to login page, API routes, and static assets
  if (pathname === '/' || pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    // If the user is already logged in and tries to go to the login page, redirect them to home
    if (session && pathname === '/') {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.next();
  }

  // If there is no session token and they try to access protected pages, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}