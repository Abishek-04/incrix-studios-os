import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reminder from '@/models/Reminder';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET /api/reminders — list reminders for current user (or all for manager)
export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isManager = user.role === 'manager' || user.role === 'superadmin';
    const { searchParams } = new URL(request.url);
    const viewAll = searchParams.get('all') === 'true' && isManager;

    const query = viewAll ? {} : { userId: user.id };
    const reminders = await Reminder.find(query).sort({ scheduledAt: 1 }).lean();

    return NextResponse.json({ success: true, reminders });
  } catch (error) {
    console.error('[API] Error fetching reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/reminders — create a reminder
export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { title, message, scheduledAt, userId } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'Title and scheduled time are required' }, { status: 400 });
    }

    const isManager = user.role === 'manager' || user.role === 'superadmin';

    // If userId is provided and user is not manager, reject
    const targetUserId = userId || user.id;
    if (targetUserId !== user.id && !isManager) {
      return NextResponse.json({ success: false, error: 'Only managers can set reminders for others' }, { status: 403 });
    }

    // Look up target user name
    let targetUserName = user.name;
    if (targetUserId !== user.id) {
      const User = (await import('@/models/User')).default;
      const targetUser = await User.findOne({ id: targetUserId }).lean();
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
      }
      targetUserName = targetUser.name;
    }

    const reminder = await Reminder.create({
      id: `REM-${uuidv4().slice(0, 8)}`,
      title,
      message: message || '',
      scheduledAt: new Date(scheduledAt),
      userId: targetUserId,
      userName: targetUserName,
      createdBy: user.id,
      createdByName: user.name,
    });

    return NextResponse.json({ success: true, reminder: reminder.toObject() }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
