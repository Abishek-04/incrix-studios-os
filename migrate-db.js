import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Old model
const studioStateSchema = new mongoose.Schema({
  users: { type: Array, default: [] },
  projects: { type: Array, default: [] },
  channels: { type: Array, default: [] },
  dailyTasks: { type: Array, default: [] },
  lastUpdated: { type: Date, default: Date.now }
}, { strict: false });

const StudioState = mongoose.model('StudioState', studioStateSchema);

// Import new models
async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Get old data
    const oldState = await StudioState.findOne();

    if (!oldState) {
      console.log('No old state found. Database might be empty.');
      console.log('Creating sample users...');

      // Create sample users
      const User = (await import('./src/models/User.js')).default;
      const users = [
        { id: 'usr1', name: 'Twinkle', role: 'manager', email: 'twinkle@incrix.com', password: 'password', avatarColor: 'bg-indigo-600', active: true, phoneNumber: '+1234567890', notifyViaWhatsapp: true, notifyViaEmail: true },
        { id: 'usr2', name: 'Abishek', role: 'creator', email: 'abishek@incrix.com', password: 'password', avatarColor: 'bg-purple-600', niche: 'Tech', active: true, notifyViaEmail: true },
      ];

      for (const userData of users) {
        await User.create(userData);
        console.log(`Created user: ${userData.name}`);
      }

      console.log('✅ Migration complete! Sample users created.');
      process.exit(0);
    }

    console.log(`Found old state with ${oldState.users?.length || 0} users`);

    // Import new models
    const User = (await import('./src/models/User.js')).default;
    const Project = (await import('./src/models/Project.js')).default;
    const Channel = (await import('./src/models/Channel.js')).default;
    const DailyTask = (await import('./src/models/DailyTask.js')).default;

    // Clear existing new collections
    await User.deleteMany({});
    await Project.deleteMany({});
    await Channel.deleteMany({});
    await DailyTask.deleteMany({});

    // Migrate users (passwords will be hashed by pre-save hook)
    if (oldState.users && oldState.users.length > 0) {
      for (const user of oldState.users) {
        // Ensure password exists, default to 'password' if missing
        if (!user.password) {
          user.password = 'password';
        }
        await User.create(user);
      }
      console.log(`✅ Migrated ${oldState.users.length} users`);
    }

    // Migrate projects
    if (oldState.projects && oldState.projects.length > 0) {
      for (const project of oldState.projects) {
        // Ensure required fields have values
        if (!project.topic) project.topic = project.title || 'Untitled';
        if (!project.vertical) project.vertical = 'software';
        if (!project.platform) project.platform = 'youtube';
        if (!project.stage) project.stage = 'Backlog';
        if (!project.status) project.status = 'Not Started';
        if (!project.priority) project.priority = 'Medium';

        await Project.create(project);
      }
      console.log(`✅ Migrated ${oldState.projects.length} projects`);
    }

    // Migrate channels
    if (oldState.channels && oldState.channels.length > 0) {
      for (const channel of oldState.channels) {
        await Channel.create(channel);
      }
      console.log(`✅ Migrated ${oldState.channels.length} channels`);
    }

    // Migrate daily tasks
    if (oldState.dailyTasks && oldState.dailyTasks.length > 0) {
      for (const task of oldState.dailyTasks) {
        await DailyTask.create(task);
      }
      console.log(`✅ Migrated ${oldState.dailyTasks.length} daily tasks`);
    }

    console.log('✅ Migration complete!');
    console.log('\n📝 Test credentials:');
    console.log('Email: twinkle@incrix.com');
    console.log('Password: password');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
