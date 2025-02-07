import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  console.log('Middleware token:', token); // Check logs for this
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register');
  const isSIgnoutPage = request.nextUrl.pathname.startsWith('/signout');

  if (!token && !isAuthPage) {
    console.log('Redirecting to login page');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    console.log('Redirecting to dashboard page');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (token && isSIgnoutPage) {
    console.log('Redirecting to login page for signout');
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('__Secure-next-auth.session-token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
    '/settings'
  ],
};
