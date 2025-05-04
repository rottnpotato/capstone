import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/admin',
  '/pos',
  '/members',
  '/member',
];

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = [
  '/login',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  let isAuthenticated = false;
  let userRole = '';
  
  // Verify token if it exists
  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      isAuthenticated = true;
      userRole = payload.RoleName as string;
    } catch (error) {
      // Token is invalid, so user is not authenticated
      console.error('Invalid token:', error);
    }
  }
  
  // Check if this is a protected route
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check role-based access
    if (pathname.startsWith('/admin') && userRole !== 'Administrator' && userRole !== 'Manager') {
      // Redirect non-admin users away from admin routes
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (pathname.startsWith('/pos') && userRole !== 'Cashier' && userRole !== 'Administrator') {
      // Redirect non-staff users away from POS routes
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if ((pathname.startsWith('/member') || pathname.startsWith('/members')) && userRole !== 'Member') {
      // Redirect non-member users away from member routes
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Redirect from login page if already authenticated
  if (AUTH_ROUTES.some(route => pathname.startsWith(route)) && isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'Administrator' || userRole === 'Manager') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else if (userRole === 'Cashier') {
      return NextResponse.redirect(new URL('/pos', request.url));
    } else if (userRole === 'Member') {
      return NextResponse.redirect(new URL('/members', request.url));
    }
    
    // Default redirect
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Continue with the request for public routes or if authentication checks pass
  return NextResponse.next();
}

// Configure the middleware to run only on specific routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/pos/:path*',
    '/member/:path*',
    '/members/:path*',
    '/login',
  ],
}; 