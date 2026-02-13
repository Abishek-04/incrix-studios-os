import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Channel from '../models/Channel.js';
import DailyTask from '../models/DailyTask.js';

dotenv.config();

// Old schema
const StudioState = mongoose.model(
  'StudioState',
  new mongoose.Schema(
    {
      users: Array,
      projects: Array,
      channels: Array,
      dailyTasks: Array
    },
    { strict: false }
  )
);

async function migrate() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // 1. Fetch old data
    console.log('\n📊 Fetching old data from StudioState collection...');
    const oldState = await StudioState.findOne();

    if (!oldState) {
      console.log('❌ No data to migrate - StudioState collection is empty');
      process.exit(0);
    }

    console.log(`Found data:`);
    console.log(`  - Users: ${oldState.users?.length || 0}`);
    console.log(`  - Projects: ${oldState.projects?.length || 0}`);
    console.log(`  - Channels: ${oldState.channels?.length || 0}`);
    console.log(`  - Daily Tasks: ${oldState.dailyTasks?.length || 0}`);

    // Maps to track old IDs → new ObjectIds
    const userIdMap = new Map();
    const channelIdMap = new Map();

    // 2. Migrate Users
    console.log('\n👥 Migrating users...');
    let userCount = 0;
    for (const oldUser of oldState.users || []) {
      try {
        const newUser = await User.create({
          id: oldUser.id,
          name: oldUser.name,
          role: oldUser.role,
          email: oldUser.email,
          password: oldUser.password || 'ChangeMe123!', // Will be hashed by pre-save hook
          phoneNumber: oldUser.phoneNumber,
          notifyViaWhatsapp: oldUser.notifyViaWhatsapp || false,
          notifyViaEmail: oldUser.notifyViaEmail !== false,
          avatarColor: oldUser.avatarColor,
          niche: oldUser.niche,
          active: oldUser.active !== false,
          quota: oldUser.quota || {
            youtubeLong: 0,
            youtubeShort: 0,
            instagramReel: 0,
            course: 0,
            period: 'weekly'
          },
          refreshTokens: []
        });
        userIdMap.set(oldUser.id, newUser._id);
        userIdMap.set(oldUser.name, newUser._id); // Also map by name for project lookup
        userCount++;
      } catch (error: any) {
        console.log(`  ⚠️  Failed to migrate user ${oldUser.name}: ${error.message}`);
      }
    }
    console.log(`✓ Migrated ${userCount} users`);

    // 3. Migrate Channels
    console.log('\n📺 Migrating channels...');
    let channelCount = 0;
    for (const oldChannel of oldState.channels || []) {
      try {
        const newChannel = await Channel.create({
          id: oldChannel.id,
          platform: oldChannel.platform,
          name: oldChannel.name,
          link: oldChannel.link,
          avatarUrl: oldChannel.avatarUrl,
          email: oldChannel.email,
          credentials: oldChannel.credentials,
          memberId: oldChannel.memberId ? userIdMap.get(oldChannel.memberId) : undefined
        });
        channelIdMap.set(oldChannel.id, newChannel._id);
        channelCount++;
      } catch (error: any) {
        console.log(`  ⚠️  Failed to migrate channel ${oldChannel.name}: ${error.message}`);
      }
    }
    console.log(`✓ Migrated ${channelCount} channels`);

    // 4. Migrate Projects
    console.log('\n📁 Migrating projects...');
    let projectCount = 0;
    for (const oldProject of oldState.projects || []) {
      try {
        // Find creator and editor by name
        const creatorId = userIdMap.get(oldProject.creator);
        const editorId = oldProject.editor ? userIdMap.get(oldProject.editor) : undefined;

        if (!creatorId) {
          console.log(`  ⚠️  Skipping project "${oldProject.title}" - creator "${oldProject.creator}" not found`);
          continue;
        }

        await Project.create({
          id: oldProject.id,
          title: oldProject.title,
          topic: oldProject.topic,
          vertical: oldProject.vertical,
          platform: oldProject.platform,
          contentFormat: oldProject.contentFormat,
          channelId: oldProject.channelId ? channelIdMap.get(oldProject.channelId) : undefined,
          role: oldProject.role,
          creatorId: creatorId,
          editorId: editorId,
          stage: oldProject.stage,
          status: oldProject.status,
          priority: oldProject.priority,
          lastUpdated: oldProject.lastUpdated,
          dueDate: oldProject.dueDate,
          durationMinutes: oldProject.durationMinutes || 0,
          script: oldProject.script || '',
          tasks: oldProject.tasks || [],
          technicalNotes: oldProject.technicalNotes || '',
          reviewLink: oldProject.reviewLink,
          publishedLink: oldProject.publishedLink,
          comments: oldProject.comments || [],
          metrics: oldProject.metrics,
          hasMographNeeds: oldProject.hasMographNeeds || false,
          archived: oldProject.archived || false
        });
        projectCount++;
      } catch (error: any) {
        console.log(`  ⚠️  Failed to migrate project "${oldProject.title}": ${error.message}`);
      }
    }
    console.log(`✓ Migrated ${projectCount} projects`);

    // 5. Migrate Daily Tasks
    console.log('\n✅ Migrating daily tasks...');
    let taskCount = 0;
    for (const oldTask of oldState.dailyTasks || []) {
      try {
        const userId = userIdMap.get(oldTask.userId);
        if (!userId) {
          console.log(`  ⚠️  Skipping task - user ID "${oldTask.userId}" not found`);
          continue;
        }

        await DailyTask.create({
          id: oldTask.id,
          date: oldTask.date,
          timeSlot: oldTask.timeSlot,
          userId: userId,
          task: oldTask.task,
          done: oldTask.done || false
        });
        taskCount++;
      } catch (error: any) {
        console.log(`  ⚠️  Failed to migrate task: ${error.message}`);
      }
    }
    console.log(`✓ Migrated ${taskCount} daily tasks`);

    // 6. Summary
    console.log('\n=================================');
    console.log('🎉 Migration Complete!');
    console.log('=================================');
    console.log(`Users:       ${userCount} migrated`);
    console.log(`Projects:    ${projectCount} migrated`);
    console.log(`Channels:    ${channelCount} migrated`);
    console.log(`Daily Tasks: ${taskCount} migrated`);
    console.log('\n⚠️  IMPORTANT: The old StudioState collection is still intact.');
    console.log('   After verifying the migration, you can manually drop it.');
    console.log('   Command: db.studiostates.drop()');
    console.log('\n✓ You can now update your application to use the new collections.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

// Run migration
console.log('=================================');
console.log('🚀 Starting Database Migration');
console.log('=================================');
console.log('This will migrate from single StudioState document');
console.log('to separate collections (Users, Projects, Channels, DailyTasks)');
console.log('');

migrate();
