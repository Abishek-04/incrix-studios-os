import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logLogin, logLoginFailed } from '@/lib/services/activityLogger';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Get IP address and User Agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

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

    // Find user by email and explicitly include password field
    const user = await User.findOne({ email, active: true }).select('+password');

    if (!user) {
      // Log failed login attempt
      await logLoginFailed(email, ipAddress, userAgent);

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password using bcrypt
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await logLoginFailed(email, ipAddress, userAgent);

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    // Log successful login
    await logLogin(userResponse, ipAddress, userAgent);

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
