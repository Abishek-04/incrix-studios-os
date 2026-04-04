import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Public routes that don't need authentication
const PUBLIC_ROUTES = [
  '/',
  '/api/login',
  '/api/auth/refresh',
  '/api/instagram/webhook',
  '/api/instagram/auth/callback',
  '/api/webhooks/instagram',
  '/api/cron/instagram',
  '/privacy-policy',
  '/terms',
  '/data-deletion',
  '/facebook-privacy-policy',
];

// API routes that need auth but are handled internally
const API_PREFIX = '/api/';

// Role-based route guards
const ROLE_GUARDS = {
  // Super Admin only
  '/analytics': ['superadmin'],
  '/api/analytics': ['superadmin'],

  // Manager + Super Admin
  '/team': ['superadmin', 'manager'],
  '/clients': ['superadmin', 'manager'],
  '/revenue': ['superadmin', 'manager'],
  '/admin': ['superadmin', 'manager'],
  '/recycle-bin': ['superadmin', 'manager'],
  '/courses': ['superadmin', 'manager'],
  '/performance': ['superadmin', 'manager'],
};

async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type === 'refresh') return null; // reject refresh tokens
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  // Skip static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('access_token')?.value;

  // No token — try refresh for pages, return 401 for APIs
  if (!token) {
    if (pathname.startsWith(API_PREFIX)) {
      // Allow API routes to handle their own auth (some have fallbacks)
      return NextResponse.next();
    }
    // Redirect to login for page routes
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify token
  const decoded = await verifyJWT(token);
  if (!decoded) {
    if (pathname.startsWith(API_PREFIX)) {
      return NextResponse.next(); // Let API routes handle expired tokens (refresh flow)
    }
    // Token invalid — try refresh before redirecting
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      // Let the page load — the client-side will auto-refresh
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role-based guards for protected routes
  for (const [route, allowedRoles] of Object.entries(ROLE_GUARDS)) {
    if (pathname.startsWith(route)) {
      const userId = decoded.userId;
      // We can't do a DB lookup in middleware efficiently, so we add the userId
      // to headers and let the page/API do the role check
      const response = NextResponse.next();
      response.headers.set('x-user-id', userId);
      return response;
    }
  }

  // Authenticated — pass through
  const response = NextResponse.next();
  response.headers.set('x-user-id', decoded.userId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
