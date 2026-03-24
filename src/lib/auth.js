import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[Auth] FATAL: JWT_SECRET environment variable is not set');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export function generateAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
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
 * Get the access token from the request.
 * Checks HttpOnly cookie first, then Authorization header as fallback.
 */
function getTokenFromRequest(request) {
  // 1. Check HttpOnly cookie
  const cookie = request.cookies?.get('access_token');
  if (cookie?.value) return cookie.value;

  // 2. Fallback to Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
}

/**
 * Authenticate request via JWT token (cookie or header).
 * Returns the decoded token payload or throws.
 */
export async function authenticate(request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new Error('No authorization header');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  return decoded;
}

/**
 * Get the authenticated user from JWT.
 * Decodes token → looks up user in DB → returns { user, source }.
 * Returns { user: null } if not authenticated.
 */
export async function getAuthUser(request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return { user: null, source: null };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return { user: null, source: null };
  }

  const connectDB = (await import('@/lib/mongodb')).default;
  await connectDB();
  const User = (await import('@/models/User')).default;
  const user = await User.findOne({ id: decoded.userId }).lean();

  if (!user) {
    return { user: null, source: null };
  }

  delete user.password;
  delete user.refreshTokens;
  return { user, source: 'jwt' };
}
