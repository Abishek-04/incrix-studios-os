import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { sendPushToUser } from '@/lib/webPush';

// GET — Fetch notifications for authenticated user
export async function GET(request) {
  try {
    await connectDB();

    const { user: authUser } = await getAuthUser(request);
    // Allow fallback to query param for backward compat (layout polls this)
    const { searchParams } = new URL(request.url);
    const userId = authUser?.id || searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const query = { userId };
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Push notification to users (manager/superadmin only)
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, type = 'info', targetUserIds = [], targetRole } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    await connectDB();

    // Authenticate via JWT
    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify sender is manager or superadmin
    if (!['superadmin', 'manager'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Resolve target users
    let userIds = [...targetUserIds];

    if (userIds.length === 0 && targetRole) {
      const query = targetRole === 'all'
        ? { isActive: { $ne: false } }
        : { role: targetRole, isActive: { $ne: false } };
      const users = await User.find(query).select('id').lean();
      userIds = users.map(u => u.id);
    } else if (userIds.length === 0) {
      const users = await User.find({ isActive: { $ne: false } }).select('id').lean();
      userIds = users.map(u => u.id);
    }

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 400 });
    }

    const notifications = userIds.map(userId => ({
      id: uuidv4(),
      userId,
      title,
      message,
      type,
      read: false,
      metadata: { sentBy: authUser.id, sentByName: authUser.name }
    }));

    await Notification.insertMany(notifications);

    const pushPayload = { title, message, type };
    Promise.allSettled(
      userIds.map(uid => sendPushToUser(uid, pushPayload))
    ).catch(err => console.error('[Push] Batch send error:', err));

    return NextResponse.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — Mark notifications as read
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { notificationIds = [], markAllRead = false } = body;

    await connectDB();

    // Authenticate via JWT
    const { user: authUser } = await getAuthUser(request);
    // Fallback to body userId for backward compat
    const userId = authUser?.id || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (markAllRead) {
      await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );
    } else if (notificationIds.length > 0) {
      await Notification.updateMany(
        { id: { $in: notificationIds }, userId },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
