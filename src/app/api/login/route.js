import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { logLogin, logLoginFailed } from '@/lib/services/activityLogger';

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeRoles(roles, fallbackRole = '') {
  if (Array.isArray(roles) && roles.length > 0) {
    return Array.from(new Set(roles.filter(Boolean)));
  }
  return fallbackRole ? [fallbackRole] : [];
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!normalizedEmail || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      await logLoginFailed(normalizedEmail, ipAddress, userAgent);
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Check active status
    const legacyActive = user.get ? user.get('active') : undefined;
    if (user.isActive === false || legacyActive === false) {
      await logLoginFailed(normalizedEmail, ipAddress, userAgent);
      return NextResponse.json({ success: false, error: 'Account is inactive' }, { status: 403 });
    }

    // Verify password (bcrypt only — plaintext passwords are rejected)
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await logLoginFailed(normalizedEmail, ipAddress, userAgent);
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token atomically
    await User.updateOne(
      { _id: user._id },
      {
        $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
        $set: { lastActive: new Date() }
      }
    );

    // Build response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    userResponse.roles = normalizeRoles(userResponse.roles, userResponse.role);

    await logLogin(userResponse, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      user: userResponse,
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
