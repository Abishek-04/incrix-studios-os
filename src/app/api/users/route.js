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

    const users = await User.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      users: users.map(u => u.toObject())
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
    if (!userData.name || !userData.email || !userData.role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and role are required' },
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
      phoneNumber: userData.phoneNumber,
      role: userData.role,
      avatarColor: userData.avatarColor || 'bg-indigo-500',
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
