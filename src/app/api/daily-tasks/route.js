import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyTask from '@/models/DailyTask';
import User from '@/models/User';
import { buildCurrentUserContext, normalizeRole } from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

const MANAGER_ROLES = new Set(['manager', 'superadmin']);

async function resolveUser(request, body = null) {
  const raw = body?.currentUser || {};
  const id = String(raw.id || raw._id || '').trim();
  const name = String(raw.name || '').trim();

  if (!id && !name) return buildCurrentUserContext({});

  let user = null;
  if (id) user = await User.findOne({ id }).select('id name role roles');
  if (!user && name) {
    user = await User.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    }).select('id name role roles');
  }
  if (!user) return buildCurrentUserContext({});

  return buildCurrentUserContext({
    id: user.id || String(user._id || ''),
    name: user.name || '',
    role: user.role || '',
    roles: Array.isArray(user.roles) ? user.roles : []
  });
}

function isManager(currentUser) {
  const primary = normalizeRole(currentUser?.role);
  if (primary) return MANAGER_ROLES.has(primary);
  return (currentUser?.roles || []).some(r => MANAGER_ROLES.has(normalizeRole(r)));
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const currentUser = await resolveUser(request, body);
    if (!currentUser.id && !currentUser.name) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const task = body.task;
    if (!task || !task.id || !task.date || !task.timeSlot || !task.userId || !task.task) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Non-managers can only create tasks for themselves
    if (!isManager(currentUser) && task.userId !== currentUser.id) {
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
