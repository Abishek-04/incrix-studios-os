import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

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
          { $set: { ...userData, password: undefined } },
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
        await Project.deleteMany({ id: { $in: idsToDelete } });
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
          { $set: project },
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
        await Channel.deleteMany({ id: { $in: idsToDelete } });
      }

      // Update or insert remaining channels
      for (const channel of body.channels) {
        await Channel.updateOne(
          { id: channel.id },
          { $set: channel },
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
        await DailyTask.deleteMany({ id: { $in: idsToDelete } });
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
          { $set: task },
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
