import { NextResponse } from 'next/server';
import { auth } from './lib/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const user = req.auth?.user;

  // Redirect unauthenticated users to signin
  if (!isAuthenticated && (nextUrl.pathname.startsWith('/chat') || nextUrl.pathname.startsWith('/subscribe'))) {
    return NextResponse.redirect(new URL('/signin', nextUrl));
  }

  // Handle authenticated users
  if (isAuthenticated && user) {
    // Redirect authenticated users away from signin page
    if (nextUrl.pathname === '/signin') {
      return NextResponse.redirect(new URL('/chat', nextUrl));
    }

    // Demo user gets direct access to chat with PRO plan
    // Allow demo user to access subscription page if they want to see plans
    if (user.email === 'demo@example.com') {
      // Demo user can access subscription page but it will show they already have PRO
      // No redirect needed for subscription page
    } else {
      // Regular users without a plan must go to subscribe page
      if (user.plan === 'NONE' && nextUrl.pathname.startsWith('/chat')) {
        return NextResponse.redirect(new URL('/subscribe', nextUrl));
      }
      // Users with a plan trying to access subscribe page go to chat
      if ((user.plan === 'BASIC' || user.plan === 'PRO') && nextUrl.pathname === '/subscribe') {
        return NextResponse.redirect(new URL('/chat', nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/chat/:path*', '/subscribe', '/signin'],
};