import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
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
  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripMongoInternals(item));
  }

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

function findRequestUser(users = [], context = {}) {
  const requestedId = String(context?.id || '').trim();
  const requestedName = normalizeText(context?.name);

  if (requestedId) {
    const byId = users.find((user) => {
      const userId = String(user?.id || user?._id || '').trim();
      const mongoId = String(user?._id || '').trim();
      return requestedId === userId || requestedId === mongoId;
    });
    if (byId) return byId;
  }

  if (requestedName) {
    const byName = users.find((user) => normalizeText(user?.name) === requestedName);
    if (byName) return byName;
  }

  return null;
}

function resolveCurrentUserContext(rawContext = {}, users = []) {
  const requestedId = String(rawContext?.id || '').trim();
  const requestedName = normalizeText(rawContext?.name);
  const matchedUser = findRequestUser(users, rawContext);

  // If client did not send any user identity, keep context empty.
  if (!requestedId && !requestedName) {
    return buildCurrentUserContext({});
  }

  // Identity sent but not found in DB: treat as unauthenticated.
  if (!matchedUser) {
    return buildCurrentUserContext({});
  }

  return buildCurrentUserContext({
    id: matchedUser.id || matchedUser._id || '',
    name: matchedUser.name || '',
    role: matchedUser.role || '',
    roles: Array.isArray(matchedUser.roles) ? matchedUser.roles : []
  });
}

async function addToRecycleBin(items, entityType, source = 'state_api') {
  if (!items || items.length === 0) return [];

  const DeletedItem = (await import('@/models/DeletedItem')).default;
  const snapshottedEntityIds = [];

  await Promise.all(
    items.map(async (item) => {
      const plain = sanitizeDoc(item);
      const entityId = String(plain?.id || item?.id || '');
      if (!entityId) {
        console.error(`[State API] Skipping ${entityType} recycle snapshot due to missing id`);
        return;
      }

      try {
        await DeletedItem.create({
          id: uuidv4(),
          entityType,
          entityId,
          source,
          deletedBy: 'system',
          data: plain,
          expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
        });
        snapshottedEntityIds.push(entityId);
      } catch (err) {
        console.error(`[State API] Failed to add ${entityType} ${entityId} to recycle bin:`, err.message);
      }
    })
  );

  return snapshottedEntityIds;
}

export async function GET(request) {
  try {
    await connectDB();

    // Import models
    const User = (await import('@/models/User')).default;
    const Project = (await import('@/models/Project')).default;
    const Channel = (await import('@/models/Channel')).default;
    const DailyTask = (await import('@/models/DailyTask')).default;

    // Fetch all data
    const users = await User.find({}).select('-password -refreshTokens');
    const projects = await Project.find({});
    const channels = await Channel.find({});
    const dailyTasks = await DailyTask.find({});

    const { searchParams } = new URL(request.url);
    const rawRoles = searchParams.get('userRoles');
    const requestedContext = buildCurrentUserContext({
      id: searchParams.get('userId') || '',
      name: searchParams.get('userName') || '',
      role: searchParams.get('userRole') || '',
      roles: rawRoles ? rawRoles.split(',') : []
    });
    const context = resolveCurrentUserContext(requestedContext, users || []);
    const hasUserContext = Boolean(context.name || context.id || normalizeRoles(context.roles, context.role).length > 0);

    const filteredProjects = hasUserContext
      ? filterProjectsForUser(projects || [], context)
      : [];

    return NextResponse.json({
      users: users || [],
      projects: filteredProjects,
      channels: channels || [],
      dailyTasks: dailyTasks || [],
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

    // Update projects (upsert only — never delete projects not in the incoming
    // array because clients receive a filtered subset and would inadvertently
    // remove other users' projects). Use DELETE /api/projects/:id for deletions.
    if (body.projects && Array.isArray(body.projects)) {
      // Resolve requesting user for permission checks
      const allUsers = await User.find({}).select('-password -refreshTokens');
      const userContext = resolveCurrentUserContext(
        buildCurrentUserContext(body.currentUser || {}),
        allUsers || []
      );
      const isManager = canManageAllProjects(userContext);

      // Import NotificationEngine for event tracking
      const notificationEngineModule = await import('@/lib/services/notificationEngine.js');
      const NotificationEngine = notificationEngineModule.NotificationEngine || notificationEngineModule.default;

      // Update or insert remaining projects
      for (const project of body.projects) {
        // Fetch existing project to detect changes
        const existingProject = await Project.findOne({ id: project.id });

        // Permission check: non-managers can only update projects they can view
        if (!isManager && existingProject && !canViewProject(existingProject, userContext)) {
          continue;
        }
        const incomingLastUpdated = Number(project?.lastUpdated || 0);
        const existingLastUpdated = Number(existingProject?.lastUpdated || 0);

        // Ignore stale writes to prevent out-of-order request overwrites.
        if (existingProject && incomingLastUpdated > 0 && existingLastUpdated > incomingLastUpdated) {
          continue;
        }

        // Check for assignment change
        if (!existingProject) {
          // New project - notify assignee
          if (project.assignedTo) {
            try {
              await NotificationEngine.onProjectAssigned(project, project.assignedTo);
            } catch (err) {
              console.error('[State API] Notification error:', err);
            }
          }
        } else if (existingProject.assignedTo !== project.assignedTo && project.assignedTo) {
          // Reassignment - notify new assignee
          try {
            await NotificationEngine.onProjectAssigned(project, project.assignedTo);
          } catch (err) {
            console.error('[State API] Notification error:', err);
          }
        }

        // Check for stage change
        if (existingProject && existingProject.stage !== project.stage) {
          try {
            await NotificationEngine.onProjectStageChanged(project, existingProject.stage, project.stage);
          } catch (err) {
            console.error('[State API] Notification error:', err);
          }
        }

        // Check if project is at risk (status === 'Blocked')
        if (existingProject && project.status === 'Blocked' && existingProject.status !== 'Blocked') {
          try {
            await NotificationEngine.onProjectAtRisk(project);
          } catch (err) {
            console.error('[State API] Notification error:', err);
          }
        }

        await Project.updateOne(
          { id: project.id },
          {
            $set: {
              ...sanitizeDoc(project),
              lastUpdated: incomingLastUpdated || Date.now()
            }
          },
          { upsert: true }
        );
      }
    }

    // Update channels (upsert only — never delete channels not in the incoming
    // array. Use DELETE /api/channels/:id for deletions.)
    if (body.channels && Array.isArray(body.channels)) {
      for (const channel of body.channels) {
        await Channel.updateOne(
          { id: channel.id },
          { $set: sanitizeDoc(channel) },
          { upsert: true }
        );
      }
    }

    // Update daily tasks (upsert only — never delete tasks not in the incoming
    // array. Use DELETE /api/daily-tasks/:id for deletions.)
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
