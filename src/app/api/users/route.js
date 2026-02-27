import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hasPermission, PERMISSIONS, ROLES } from '@/config/permissions';
import { logUserAction } from '@/utils/activityLogger';

/**
 * GET /api/users
 * Get all users (with role-based filtering)
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const all = searchParams.get('all') === '1' || searchParams.get('all') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 5000) : 100;

    // Build query
    let query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = { $ne: false };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    let userQuery = User.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });

    if (!all) {
      userQuery = userQuery.limit(limit);
    }

    const users = await userQuery;

    return NextResponse.json({
      success: true,
      users: users.map((u) => {
        const plain = u.toObject();
        return {
          ...plain,
          // Backward compatibility for legacy rows that don't have custom `id`
          id: plain.id || String(plain._id)
        };
      })
    });
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user (Super Admin only)
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { currentUser, userData } = body;

    // Permission check
    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.CREATE_USERS)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!userData.name || !userData.email || !userData.role || !userData.password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, role, and password are required' },
        { status: 400 }
      );
    }

    if (userData.password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await User.create({
      id: userData.id || `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phoneNumber: userData.phoneNumber,
      role: userData.role,
      avatarColor: userData.avatarColor || 'bg-indigo-500',
      profilePhoto: userData.profilePhoto || '',
      isActive: userData.isActive !== false,
      createdAt: Date.now(),
      lastActive: Date.now()
    });

    // Log activity
    logUserAction('created', newUser.toObject(), currentUser);

    return NextResponse.json({
      success: true,
      user: newUser.toObject()
    });
  } catch (error) {
    console.error('[API] Error creating user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
