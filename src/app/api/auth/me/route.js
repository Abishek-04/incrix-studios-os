import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await authenticate(request);

    await connectDB();
    const User = (await import('@/models/User')).default;

    const user = await User.findOne({ id: decoded.userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    return NextResponse.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get user error:', error);
    const status = error.message === 'No authorization header' || error.message === 'Invalid or expired token' ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get user' },
      { status }
    );
  }
}
