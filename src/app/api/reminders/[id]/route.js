import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reminder from '@/models/Reminder';
import { getAuthUser } from '@/lib/auth';

// DELETE /api/reminders/[id]
export async function DELETE(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const reminder = await Reminder.findOne({ id });
    if (!reminder) {
      return NextResponse.json({ success: false, error: 'Reminder not found' }, { status: 404 });
    }

    // Only the creator or managers can delete
    const isManager = user.role === 'manager' || user.role === 'superadmin';
    if (reminder.createdBy !== user.id && !isManager) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    await Reminder.deleteOne({ id });
    return NextResponse.json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    console.error('[API] Error deleting reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
