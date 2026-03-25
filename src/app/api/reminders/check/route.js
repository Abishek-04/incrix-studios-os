import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Reminder from '@/models/Reminder';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET /api/reminders/check — find due reminders and create notifications
// Called periodically by the client (polling) or by a cron job
export async function GET() {
  try {
    await connectDB();

    const now = new Date();

    // Find all unnotified reminders that are due
    const dueReminders = await Reminder.find({
      scheduledAt: { $lte: now },
      notified: false,
    });

    if (dueReminders.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const Notification = (await import('@/models/Notification')).default;

    const notifications = dueReminders.map((reminder) => ({
      id: uuidv4(),
      userId: reminder.userId,
      title: `Reminder: ${reminder.title}`,
      message: reminder.message || reminder.title,
      type: 'info',
      read: false,
      metadata: {
        sentBy: reminder.createdBy,
        sentByName: reminder.createdByName,
        reminderId: reminder.id,
      },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Send push notifications (fire & forget)
    const { sendPushToUser } = await import('@/lib/webPush');
    Promise.allSettled(
      dueReminders.map((reminder) =>
        sendPushToUser(reminder.userId, {
          title: `Reminder: ${reminder.title}`,
          body: reminder.message || reminder.title,
          icon: '/icons/icon-192.png',
          tag: `reminder-${reminder.id}`,
        })
      )
    ).catch(() => {});

    // Mark reminders as notified
    const reminderIds = dueReminders.map((r) => r.id);
    await Reminder.updateMany(
      { id: { $in: reminderIds } },
      { $set: { notified: true, notifiedAt: now } }
    );

    // Check for approaching deadlines (within 24 hours)
    try {
      const Project = (await import('@/models/Project')).default;
      const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const upcomingProjects = await Project.find({
        dueDate: { $lte: oneDayFromNow.getTime(), $gte: now.getTime() },
        stage: { $ne: 'Done' },
        archived: { $ne: true },
        _deadlineNotified: { $ne: true },
      });

      if (upcomingProjects.length > 0) {
        const deadlineNotifs = upcomingProjects.map((p) => ({
          id: uuidv4(),
          userId: p.creator,
          title: 'Deadline approaching',
          message: `"${p.title}" is due ${p.dueDate - Date.now() < 3600000 ? 'in less than 1 hour' : 'tomorrow'}`,
          type: 'warning',
          read: false,
        }));
        await Notification.insertMany(deadlineNotifs);

        // Mark projects as notified to avoid duplicate alerts
        const projectIds = upcomingProjects.map(p => p._id);
        await Project.updateMany(
          { _id: { $in: projectIds } },
          { $set: { _deadlineNotified: true } }
        );
      }
    } catch (err) {
      console.error('[deadline-check] Error:', err);
    }

    return NextResponse.json({ success: true, processed: dueReminders.length });
  } catch (error) {
    console.error('[API] Error checking reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
