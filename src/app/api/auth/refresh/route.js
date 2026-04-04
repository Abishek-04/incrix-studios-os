import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken, generateAccessToken, getRefreshTokenFromRequest, setAuthCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    // Read refresh token from cookie first, then body fallback
    let refreshToken = getRefreshTokenFromRequest(request);
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch { /* no body */ }
    }

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'Refresh token required' }, { status: 401 });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid or expired refresh token' }, { status: 403 });
    }

    if (decoded.type && decoded.type !== 'refresh') {
      return NextResponse.json({ success: false, error: 'Invalid token type' }, { status: 403 });
    }

    await connectDB();
    const User = (await import('@/models/User')).default;

    const user = await User.findOne({ id: decoded.userId, refreshTokens: refreshToken });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Refresh token not found' }, { status: 403 });
    }

    const accessToken = generateAccessToken(user.id, user.role);

    const response = NextResponse.json({ success: true, accessToken });
    setAuthCookies(response, accessToken, null);
    return response;

  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ success: false, error: 'Failed to refresh token' }, { status: 500 });
  }
}
