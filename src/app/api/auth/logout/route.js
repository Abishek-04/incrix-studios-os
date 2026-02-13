import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';

export async function POST(request) {
  try {
    // Authenticate
    const decoded = await authenticate(request);

    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token required' },
        { status: 400 }
      );
    }

    await connectDB();
    const User = (await import('@/models/User')).default;

    // Remove refresh token from user
    await User.updateOne(
      { id: decoded.userId },
      { $pull: { refreshTokens: refreshToken } }
    );

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to logout' },
      { status: 500 }
    );
  }
}
