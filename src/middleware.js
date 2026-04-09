import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Routes that don't need authentication
const PUBLIC_ROUTES = [
  '/',
  '/api/login',
  '/api/auth/refresh',
  '/api/instagram/webhook',
  '/api/instagram/auth/callback',
  '/api/webhooks/instagram',
  '/api/cron/instagram',
  '/privacy-policy',
  '/privacy',
  '/terms',
  '/data-deletion',
  '/facebook-privacy-policy',
];

// Role-based route guards — who can access what
const ROLE_GUARDS = {
  // Super Admin only
  '/analytics': ['superadmin'],
  '/api/analytics': ['superadmin'],

  // Manager + Super Admin
  '/team': ['superadmin', 'manager'],
  // Note: /api/users is NOT guarded here — chat, mail, attendance all need
  // to read the user list. Write operations are protected in the route itself.
  '/clients': ['superadmin', 'manager'],
  '/api/clients': ['superadmin', 'manager'],
  '/revenue': ['superadmin', 'manager'],
  '/api/revenue': ['superadmin', 'manager'],
  '/admin': ['superadmin', 'manager'],
  '/recycle-bin': ['superadmin', 'manager'],
  '/api/recycle-bin': ['superadmin', 'manager'],
  '/courses': ['superadmin', 'manager'],
  '/performance': ['superadmin', 'manager'],
};

async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type === 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

function isPublic(pathname) {
  return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (isPublic(pathname)) return NextResponse.next();

  // Skip static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const isAPI = pathname.startsWith('/api/');

  // No token
  if (!token) {
    if (isAPI) {
      // Let API routes handle their own auth (supports refresh flow)
      return NextResponse.next();
    }
    // Check if refresh token exists — allow page to load for client-side refresh
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken) return NextResponse.next();
    // No tokens at all — redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify token
  const decoded = await verifyJWT(token);

  if (!decoded) {
    if (isAPI) return NextResponse.next();
    // Expired access token — allow page to load, client will refresh
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken) return NextResponse.next();
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Token valid — check role guards
  const userRole = decoded.role;

  for (const [route, allowedRoles] of Object.entries(ROLE_GUARDS)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        if (isAPI) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        // Redirect unauthorized users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      break;
    }
  }

  // Pass user info via headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', decoded.userId);
  response.headers.set('x-user-role', userRole || '');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
