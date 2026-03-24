import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await authenticate(request);

    await connectDB();
    const User = (await import('@/models/User')).default;

    // Remove all refresh tokens for this user on logout
    await User.updateOne(
      { id: decoded.userId },
      { $set: { refreshTokens: [] } }
    );

    return NextResponse.json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    // Still return success even if token is invalid — user wants to log out
    return NextResponse.json({ success: true, message: 'Logged out' });
  }
}
