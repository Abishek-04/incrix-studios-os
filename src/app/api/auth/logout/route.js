import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { getCookie, clearAuthCookies, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';

export async function POST(request) {
  try {
    const refreshToken = getCookie(request, REFRESH_TOKEN_COOKIE);

    if (refreshToken) {
      const decoded = verifyToken(refreshToken);
      if (decoded) {
        await connectDB();
        const User = (await import('@/models/User')).default;

        // Remove refresh token from user
        await User.updateOne(
          { id: decoded.userId },
          { $pull: { refreshTokens: refreshToken } }
        );
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear auth cookies
    clearAuthCookies(response);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even on error
    const response = NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
    clearAuthCookies(response);
    return response;
  }
}
