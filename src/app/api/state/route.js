import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import {
  buildCurrentUserContext,
  canManageAllProjects,
  canViewProject,
  filterProjectsForUser,
  normalizeRoles,
  normalizeText
} from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

function toPlainObject(input) {
  if (!input) return {};
  if (typeof input.toObject === 'function') return input.toObject();
  if (input._doc && typeof input._doc === 'object') return { ...input._doc };
  return { ...input };
}

function stripMongoInternals(value) {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => stripMongoInternals(item));
  if (value && typeof value === 'object') {
    const result = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === '_id' || key === '__v') continue;
      result[key] = stripMongoInternals(nestedValue);
    }
    return result;
  }
  return value;
}

function sanitizeDoc(input) {
  return stripMongoInternals(toPlainObject(input));
}

function buildContextFromUser(user) {
  return buildCurrentUserContext({
    id: user.id || String(user._id || ''),
    name: user.name || '',
    role: user.role || '',
    roles: Array.isArray(user.roles) ? user.roles : []
  });
}

export async function GET(request) {
  try {
    await connectDB();

    // Authenticate via JWT
    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const context = buildContextFromUser(authUser);

    // Import models
    const User = (await import('@/models/User')).default;
    const Project = (await import('@/models/Project')).default;
    const Channel = (await import('@/models/Channel')).default;
    const DailyTask = (await import('@/models/DailyTask')).default;
    const Course = (await import('@/models/Course')).default;
    const BaseProject = (await import('@/models/BaseProject')).default;

    // Fetch all data
    const users = await User.find({}).select('-password -refreshTokens');
    const projects = await Project.find({});
    const channels = await Channel.find({});
    const dailyTasks = await DailyTask.find({});
    const courses = await Course.find({}).sort({ createdAt: -1 });
    const baseProjects = await BaseProject.find({});

    const filteredProjects = filterProjectsForUser(projects || [], context);

    return NextResponse.json({
      users: users || [],
      projects: filteredProjects,
      devDesignProjects: (baseProjects || []).map(p => sanitizeDoc(p)),
      channels: channels || [],
      dailyTasks: dailyTasks || [],
      courses: courses || [],
      lastUpdated: new Date()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Get state error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch state' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await connectDB();

    // Authenticate via JWT
    const { user: authUser } = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const context = buildContextFromUser(authUser);
    const isManager = canManageAllProjects(context);

    // Import models
    const User = (await import('@/models/User')).default;
    const Project = (await import('@/models/Project')).default;
    const Channel = (await import('@/models/Channel')).default;
    const DailyTask = (await import('@/models/DailyTask')).default;

    // Update users (preserve passwords)
    if (body.users && Array.isArray(body.users)) {
      for (const userData of body.users) {
        await User.updateOne(
          { id: userData.id },
          { $set: { ...sanitizeDoc(userData), password: undefined } },
          { upsert: true }
        );
      }
    }

    // Update projects
    if (body.projects && Array.isArray(body.projects)) {
      const notificationEngineModule = await import('@/lib/services/notificationEngine.js');
      const NotificationEngine = notificationEngineModule.NotificationEngine || notificationEngineModule.default;

      for (const project of body.projects) {
        const existingProject = await Project.findOne({ id: project.id });

        if (!isManager && existingProject && !canViewProject(existingProject, context)) {
          continue;
        }

        const incomingLastUpdated = Number(project?.lastUpdated || 0);
        const existingLastUpdated = Number(existingProject?.lastUpdated || 0);

        if (existingProject && incomingLastUpdated > 0 && existingLastUpdated > incomingLastUpdated) {
          continue;
        }

        // Notification checks
        if (!existingProject && project.assignedTo) {
          try { await NotificationEngine.onProjectAssigned(project, project.assignedTo); } catch (err) { console.error('[State API] Notification error:', err); }
        } else if (existingProject && existingProject.assignedTo !== project.assignedTo && project.assignedTo) {
          try { await NotificationEngine.onProjectAssigned(project, project.assignedTo); } catch (err) { console.error('[State API] Notification error:', err); }
        }

        if (existingProject && existingProject.stage !== project.stage) {
          try { await NotificationEngine.onProjectStageChanged(project, existingProject.stage, project.stage); } catch (err) { console.error('[State API] Notification error:', err); }
        }

        if (existingProject && project.status === 'Blocked' && existingProject.status !== 'Blocked') {
          try { await NotificationEngine.onProjectAtRisk(project); } catch (err) { console.error('[State API] Notification error:', err); }
        }

        await Project.updateOne(
          { id: project.id },
          { $set: { ...sanitizeDoc(project), lastUpdated: incomingLastUpdated || Date.now() } },
          { upsert: true }
        );
      }
    }

    // Update channels
    if (body.channels && Array.isArray(body.channels)) {
      for (const channel of body.channels) {
        await Channel.updateOne(
          { id: channel.id },
          { $set: sanitizeDoc(channel) },
          { upsert: true }
        );
      }
    }

    // Update daily tasks
    if (body.dailyTasks && Array.isArray(body.dailyTasks)) {
      for (const task of body.dailyTasks) {
        await DailyTask.updateOne(
          { id: task.id },
          { $set: sanitizeDoc(task) },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'State updated successfully'
    });

  } catch (error) {
    console.error('Update state error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update state' },
      { status: 500 }
    );
  }
}
