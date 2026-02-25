import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

function toPlainObject(input) {
  if (!input) return {};
  if (typeof input.toObject === 'function') return input.toObject();
  if (input._doc && typeof input._doc === 'object') return { ...input._doc };
  return { ...input };
}

function stripMongoInternals(value) {
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

    return NextResponse.json({
      users: users || [],
      projects: projects || [],
      channels: channels || [],
      dailyTasks: dailyTasks || [],
      lastUpdated: new Date()
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

    // Update projects
    if (body.projects && Array.isArray(body.projects)) {
      // Get all existing project IDs
      const existingProjects = await Project.find({}).select('id');
      const existingIds = existingProjects.map(p => p.id);

      // Get incoming project IDs
      const incomingIds = body.projects.map(p => p.id);

      // Find projects that need to be deleted (in DB but not in incoming array)
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

      // Delete projects that are no longer in the array
      if (idsToDelete.length > 0) {
        const projectsToDelete = await Project.find({ id: { $in: idsToDelete } });
        const snapshottedIds = await addToRecycleBin(projectsToDelete, 'project');
        if (snapshottedIds.length > 0) {
          await Project.deleteMany({ id: { $in: snapshottedIds } });
        }
        if (snapshottedIds.length !== idsToDelete.length) {
          console.error('[State API] Some projects were not deleted because recycle snapshot failed');
        }
      }

      // Import NotificationEngine for event tracking
      const { NotificationEngine } = (await import('@/lib/services/notificationEngine.js')).default || (await import('@/lib/services/notificationEngine.js'));

      // Update or insert remaining projects
      for (const project of body.projects) {
        // Fetch existing project to detect changes
        const existingProject = await Project.findOne({ id: project.id });

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
          { $set: sanitizeDoc(project) },
          { upsert: true }
        );
      }
    }

    // Update channels
    if (body.channels && Array.isArray(body.channels)) {
      // Get all existing channel IDs from the database
      const existingChannels = await Channel.find({}).select('id');
      const existingIds = existingChannels.map(c => c.id);

      // Get incoming channel IDs
      const incomingIds = body.channels.map(c => c.id);

      // Find channels that need to be deleted (in DB but not in incoming array)
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

      // Delete channels that are no longer in the array
      if (idsToDelete.length > 0) {
        const channelsToDelete = await Channel.find({ id: { $in: idsToDelete } });
        const snapshottedIds = await addToRecycleBin(channelsToDelete, 'channel');
        if (snapshottedIds.length > 0) {
          await Channel.deleteMany({ id: { $in: snapshottedIds } });
        }
        if (snapshottedIds.length !== idsToDelete.length) {
          console.error('[State API] Some channels were not deleted because recycle snapshot failed');
        }
      }

      // Update or insert remaining channels
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
      // Get all existing daily task IDs from the database
      const existingTasks = await DailyTask.find({}).select('id');
      const existingIds = existingTasks.map(t => t.id);

      // Get incoming daily task IDs
      const incomingIds = body.dailyTasks.map(t => t.id);

      // Find tasks that need to be deleted (in DB but not in incoming array)
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

      // Delete tasks that are no longer in the array
      if (idsToDelete.length > 0) {
        const tasksToDelete = await DailyTask.find({ id: { $in: idsToDelete } });
        const snapshottedIds = await addToRecycleBin(tasksToDelete, 'daily_task');
        if (snapshottedIds.length > 0) {
          await DailyTask.deleteMany({ id: { $in: snapshottedIds } });
        }
        if (snapshottedIds.length !== idsToDelete.length) {
          console.error('[State API] Some daily tasks were not deleted because recycle snapshot failed');
        }
      }

      // Import NotificationEngine if not already imported
      const NotificationEngineModule = await import('@/lib/services/notificationEngine.js');
      const TaskNotificationEngine = NotificationEngineModule.default?.NotificationEngine || NotificationEngineModule.NotificationEngine;

      // Update or insert remaining tasks
      for (const task of body.dailyTasks) {
        // Check if this is a new task
        const existingTask = await DailyTask.findOne({ id: task.id });

        if (!existingTask && task.userId) {
          // New task - notify assignee
          try {
            await TaskNotificationEngine.onTaskAssigned(task, task.userId);
          } catch (err) {
            console.error('[State API] Task notification error:', err);
          }
        }

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
