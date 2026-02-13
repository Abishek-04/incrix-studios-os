import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Import User model here to avoid circular dependencies
    const User = (await import('@/models/User')).default;

    // Find user by email
    const user = await User.findOne({ email, active: true });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // For now, simple password check (in production, use bcrypt)
    // The user.password should be hashed, but keeping simple for migration
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    return NextResponse.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
