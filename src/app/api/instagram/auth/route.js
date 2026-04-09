import { NextResponse } from 'next/server';
import { buildInstagramLoginUrl } from '@/services/instagramAuthService';
import { authenticate, getRefreshTokenFromRequest, verifyToken, generateAccessToken, setAuthCookies } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/instagram/auth
 * Redirect authenticated user to Instagram OAuth login.
 * Since this is called via direct navigation (not fetch), we handle
 * expired access tokens by falling back to the refresh token.
 */
export async function GET(request) {
  const reqUrl = new URL(request.url);
  const BASE_URL = `${reqUrl.protocol}//${reqUrl.host}`;

  try {
    let userId;
    let needsNewAccessToken = false;

    // Try access token first
    try {
      const decoded = await authenticate(request);
      userId = decoded.userId;
    } catch {
      // Access token missing/expired — try refresh token
      const refreshToken = getRefreshTokenFromRequest(request);
      if (!refreshToken) {
        return NextResponse.redirect(`${BASE_URL}/instagram?error=auth_required`);
      }
      const decoded = verifyToken(refreshToken);
      if (!decoded || decoded.type !== 'refresh') {
        return NextResponse.redirect(`${BASE_URL}/instagram?error=session_expired`);
      }
      userId = decoded.userId;
      needsNewAccessToken = true;
    }

    if (!userId) {
      return NextResponse.redirect(`${BASE_URL}/instagram?error=auth_required`);
    }

    const loginUrl = buildInstagramLoginUrl(userId);
    console.log('[instagram-auth] Redirecting to Instagram OAuth');
    const response = NextResponse.redirect(loginUrl);

    // Issue a fresh access token cookie so subsequent requests don't fail
    if (needsNewAccessToken) {
      await connectDB();
      const user = await User.findOne({ id: userId }).select('role').lean();
      const newAccessToken = generateAccessToken(userId, user?.role || 'user');
      setAuthCookies(response, newAccessToken, null);
    }

    return response;
  } catch (error) {
    console.error('[instagram-auth] Error:', error);
    return NextResponse.redirect(`${BASE_URL}/instagram?error=connection_failed`);
  }
}
