import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import DailyTask from '@/models/DailyTask';
import DeletedItem from '@/models/DeletedItem';
import { buildCurrentUserContext, canManageAllProjects } from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const taskId = decodeURIComponent(id);
    const body = await request.json();
    const currentUser = buildCurrentUserContext(body.currentUser || {});
    if (!currentUser.id && !currentUser.name) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const task = await DailyTask.findOne({ id: taskId });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Non-managers can only update their own tasks
    if (!canManageAllProjects(currentUser) && task.userId !== currentUser.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const updates = body.updates || {};
    const allowedFields = ['task', 'done', 'timeSlot', 'date', 'sourceProjectId', 'projectType'];
    const sanitized = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        sanitized[key] = updates[key];
      }
    }

    const updated = await DailyTask.findOneAndUpdate(
      { id: taskId },
      { $set: sanitized },
      { new: true }
    );

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('[DailyTasks] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const taskId = decodeURIComponent(id);
    const body = await request.json().catch(() => ({}));
    const currentUser = buildCurrentUserContext(body.currentUser || {});
    if (!currentUser.id && !currentUser.name) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const task = await DailyTask.findOne({ id: taskId });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Non-managers can only delete their own tasks
    if (!canManageAllProjects(currentUser) && task.userId !== currentUser.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Add to recycle bin
    const plain = task.toObject();
    delete plain._id;
    delete plain.__v;

    const recycledItem = await DeletedItem.create({
      id: uuidv4(),
      entityType: 'daily_task',
      entityId: taskId,
      source: 'daily_tasks_api',
      deletedBy: currentUser.name || 'system',
      data: plain,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await DailyTask.deleteOne({ id: taskId });

    return NextResponse.json({ success: true, deletedItemId: recycledItem.id });
  } catch (error) {
    console.error('[DailyTasks] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
