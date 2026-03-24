import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS, ROLES } from '@/config/permissions';
import { logUserAction } from '@/utils/activityLogger';

export const dynamic = 'force-dynamic';

function normalizeRole(role) {
  if (typeof role !== 'string') return '';
  return role.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function normalizeRoles(roles, fallbackRole = '') {
  const list = Array.isArray(roles) ? roles : [];
  const normalized = list.map(normalizeRole).filter(Boolean);
  if (normalized.length > 0) return Array.from(new Set(normalized));
  const fallback = normalizeRole(fallbackRole);
  return fallback ? [fallback] : [];
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function serializeUser(user) {
  const plain = user?.toObject ? user.toObject() : { ...user };
  delete plain.password;
  delete plain.refreshTokens;
  return {
    ...plain,
    id: plain.id || String(plain._id),
    roles: normalizeRoles(plain.roles, plain.role)
  };
}

function validateRoles(roles) {
  const allowedRoles = new Set(Object.values(ROLES));
  return Array.isArray(roles) && roles.length > 0 && roles.every((role) => allowedRoles.has(role));
}

export async function GET(request) {
  try {
    await connectDB();

    // Authenticate via JWT
    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const all = searchParams.get('all') === '1' || searchParams.get('all') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 5000) : 100;

    const andConditions = [];

    if (role && role !== 'all') {
      andConditions.push({ $or: [{ role }, { roles: role }] });
    }

    if (status === 'active') {
      andConditions.push({ isActive: { $ne: false } });
    } else if (status === 'inactive') {
      andConditions.push({ isActive: false });
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      andConditions.push({ $or: [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } }
      ] });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    let userQuery = User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    if (!all) {
      userQuery = userQuery.limit(limit);
    }

    const users = await userQuery;

    return NextResponse.json({
      success: true,
      users: users.map((u) => serializeUser(u))
    });
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    // Authenticate via JWT
    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Permission check using DB user's role
    if (!hasPermission(normalizeRole(authUser.role), PERMISSIONS.CREATE_USERS)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { userData } = body;

    const normalizedEmail = normalizeEmail(userData.email);
    const normalizedUserRoles = normalizeRoles(userData.roles, userData.role);
    const primaryRole = normalizedUserRoles[0];

    if (!userData.name || !normalizedEmail || !primaryRole || !userData.password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, at least one role, and password are required' },
        { status: 400 }
      );
    }

    if (!validateRoles(normalizedUserRoles)) {
      return NextResponse.json({ success: false, error: 'One or more selected roles are invalid' }, { status: 400 });
    }

    if (userData.password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });
    }

    const newUser = await User.create({
      id: userData.id || `user-${Date.now()}`,
      name: userData.name,
      email: normalizedEmail,
      password: userData.password,
      phoneNumber: userData.phoneNumber,
      role: primaryRole,
      roles: normalizedUserRoles,
      avatarColor: userData.avatarColor || 'bg-indigo-500',
      profilePhoto: userData.profilePhoto || '',
      isActive: userData.isActive !== false,
      createdAt: Date.now(),
      lastActive: Date.now()
    });

    logUserAction('created', serializeUser(newUser), serializeUser(authUser));

    return NextResponse.json({ success: true, user: serializeUser(newUser) });
  } catch (error) {
    console.error('[API] Error creating user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
