import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken, generateAccessToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'Refresh token required' }, { status: 401 });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid or expired refresh token' }, { status: 403 });
    }

    // Reject access tokens used as refresh tokens
    if (decoded.type && decoded.type !== 'refresh') {
      return NextResponse.json({ success: false, error: 'Invalid token type' }, { status: 403 });
    }

    await connectDB();
    const User = (await import('@/models/User')).default;

    const user = await User.findOne({ id: decoded.userId, refreshTokens: refreshToken });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Refresh token not found' }, { status: 403 });
    }

    const accessToken = generateAccessToken(user.id);

    return NextResponse.json({ success: true, accessToken });

  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ success: false, error: 'Failed to refresh token' }, { status: 500 });
  }
}
