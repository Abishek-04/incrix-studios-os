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
      for (const project of body.projects) {
        await Project.updateOne(
          { id: project.id },
          { $set: project },
          { upsert: true }
        );
      }
    }

    // Update channels
    if (body.channels && Array.isArray(body.channels)) {
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
      for (const task of body.dailyTasks) {
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
