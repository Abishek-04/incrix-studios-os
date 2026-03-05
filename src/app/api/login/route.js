import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { logLogin, logLoginFailed } from '@/lib/services/activityLogger';

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
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
      // Hash the plaintext password before saving
      const bcrypt = (await import('bcryptjs')).default;
      user.password = await bcrypt.hash(password, 12);
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

    // Generate JWT tokens
    const jwtAccessToken = generateAccessToken(user.id);
    const jwtRefreshToken = generateRefreshToken(user.id);

    // Store refresh token in user's token list
    if (!user.refreshTokens) user.refreshTokens = [];
    user.refreshTokens.push(jwtRefreshToken);
    // Keep only last 5 refresh tokens to prevent unbounded growth
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    user.lastActive = new Date();
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    userResponse.roles = normalizeRoles(userResponse.roles, userResponse.role);

    // Log successful login
    await logLogin(userResponse, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      user: userResponse,
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
