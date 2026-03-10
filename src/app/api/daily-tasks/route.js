import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyTask from '@/models/DailyTask';
import { buildCurrentUserContext, canManageAllProjects } from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const currentUser = buildCurrentUserContext(body.currentUser || {});
    if (!currentUser.id && !currentUser.name) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const task = body.task;
    if (!task || !task.id || !task.date || !task.timeSlot || !task.userId || !task.task) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Non-managers can only create tasks for themselves
    if (!canManageAllProjects(currentUser) && task.userId !== currentUser.id) {
      return NextResponse.json({ success: false, error: 'You can only create tasks for yourself' }, { status: 403 });
    }

    const created = await DailyTask.create({
      id: task.id,
      date: task.date,
      timeSlot: task.timeSlot,
      userId: task.userId,
      userName: task.userName || currentUser.name,
      task: task.task,
      done: task.done || false,
      sourceProjectId: task.sourceProjectId || undefined,
      projectType: task.projectType || undefined
    });

    return NextResponse.json({ success: true, task: created });
  } catch (error) {
    console.error('[DailyTasks] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}
