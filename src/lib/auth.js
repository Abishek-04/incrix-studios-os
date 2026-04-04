import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('[Auth] FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Cookie config for httpOnly tokens
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookies(response, accessToken, refreshToken) {
  response.cookies.set('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60, // 15 minutes
  });
  if (refreshToken) {
    response.cookies.set('refresh_token', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }
  return response;
}

export function clearAuthCookies(response) {
  response.cookies.set('access_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set('refresh_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}

/**
 * Extract token from cookie first, then Authorization header fallback.
 */
function getTokenFromRequest(request) {
  // Try cookie first (httpOnly)
  const cookieToken = request.cookies?.get?.('access_token')?.value;
  if (cookieToken) return cookieToken;

  // Fallback to Authorization header (for API clients, Pusher, etc.)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

/**
 * Get refresh token from cookie or request body.
 */
export function getRefreshTokenFromRequest(request) {
  return request.cookies?.get?.('refresh_token')?.value || null;
}

/**
 * Authenticate request. Returns decoded token or throws.
 */
export async function authenticate(request) {
  const token = getTokenFromRequest(request);
  if (!token) throw new Error('No authorization header');

  const decoded = verifyToken(token);
  if (!decoded) throw new Error('Invalid or expired token');

  // Reject refresh tokens used as access tokens
  if (decoded.type === 'refresh') throw new Error('Invalid token type');

  return decoded;
}

/**
 * Get authenticated user from JWT → DB lookup.
 * Returns { user, source } or { user: null }.
 */
export async function getAuthUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) return { user: null, source: null };

  const decoded = verifyToken(token);
  if (!decoded) return { user: null, source: null };

  const connectDB = (await import('@/lib/mongodb')).default;
  await connectDB();
  const User = (await import('@/models/User')).default;
  const user = await User.findOne({ id: decoded.userId }).lean();

  if (!user) return { user: null, source: null };

  delete user.password;
  delete user.refreshTokens;
  return { user, source: 'jwt' };
}
