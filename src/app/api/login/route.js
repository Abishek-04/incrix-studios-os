import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logLogin, logLoginFailed } from '@/lib/services/activityLogger';

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    // Get IP address and User Agent for logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate input
    if (!normalizedEmail || !password) {
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
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      // Log failed login attempt
      await logLoginFailed(normalizedEmail, ipAddress, userAgent);

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Respect both modern `isActive` and legacy `active` flag.
    const legacyActive = user.get ? user.get('active') : undefined;
    const isUserActive = user.isActive !== false && legacyActive !== false;
    if (!isUserActive) {
      await logLoginFailed(normalizedEmail, ipAddress, userAgent);
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Compare password using bcrypt. Fallback for legacy plain-text seeded accounts.
    let isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid && user.password && !isBcryptHash(user.password) && user.password === password) {
      isPasswordValid = true;
      user.password = password;
      await user.save();
    }

    if (!isPasswordValid) {
      // Log failed login attempt
      await logLoginFailed(normalizedEmail, ipAddress, userAgent);

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    user.lastActive = new Date();
    await user.save();

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
