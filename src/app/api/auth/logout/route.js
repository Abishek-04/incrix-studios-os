import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { authenticate, clearAuthCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await authenticate(request);

    await connectDB();
    const User = (await import('@/models/User')).default;

    await User.updateOne(
      { id: decoded.userId },
      { $set: { refreshTokens: [] } }
    );

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    clearAuthCookies(response);
    return response;

  } catch (error) {
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    clearAuthCookies(response);
    return response;
  }
}
