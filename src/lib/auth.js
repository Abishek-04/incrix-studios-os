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

// Helper function for API routes to authenticate requests
export async function authenticate(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  return decoded;
}

/**
 * Get authenticated user — tries JWT first, falls back to request body currentUser.
 * Returns { user, source } where source is 'jwt' or 'body'.
 * Use this during the migration period while endpoints transition to JWT.
 */
export async function getAuthUser(request, body = null) {
  // Try JWT first
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const connectDB = (await import('@/lib/mongodb')).default;
      await connectDB();
      const User = (await import('@/models/User')).default;
      const user = await User.findOne({ id: decoded.userId }).lean();
      if (user) {
        delete user.password;
        delete user.refreshTokens;
        return { user, source: 'jwt' };
      }
    }
  }

  // Fallback to request body (backward compat)
  if (body?.currentUser?.id || body?.currentUser?._id) {
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const User = (await import('@/models/User')).default;
    const userId = body.currentUser.id || body.currentUser._id;
    const user = await User.findOne({ id: userId }).lean();
    if (user) {
      delete user.password;
      delete user.refreshTokens;
      return { user, source: 'body' };
    }
  }

  return { user: null, source: null };
}
