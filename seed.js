import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const INITIAL_USERS = [
    { id: 'usr1', name: 'Alex D.', role: 'manager', email: 'alex@incrix.com', avatarColor: 'bg-indigo-600', active: true, phoneNumber: '+1234567890', notifyViaWhatsapp: true },
    { id: 'usr2', name: 'Abishek', role: 'creator', email: 'abishek@incrix.com', avatarColor: 'bg-purple-600', niche: 'Tech', active: true, quota: { longVideo: 2, shortVideo: 4, period: 'weekly' } },
    { id: 'usr3', name: 'Jegannath', role: 'creator', email: 'jegan@incrix.com', avatarColor: 'bg-emerald-600', niche: 'Coding', active: true, quota: { longVideo: 1, shortVideo: 3, period: 'weekly' } },
    { id: 'usr4', name: 'Johnson', role: 'creator', email: 'johnson@incrix.com', avatarColor: 'bg-amber-600', niche: 'Vlog', active: true, quota: { longVideo: 1, shortVideo: 5, period: 'weekly' } },
    { id: 'usr5', name: 'Manisha', role: 'creator', email: 'manisha@incrix.com', avatarColor: 'bg-pink-600', niche: 'Lifestyle', active: true, quota: { longVideo: 0, shortVideo: 7, period: 'weekly' } },
    { id: 'usr6', name: 'Mike T.', role: 'editor', email: 'mike@incrix.com', avatarColor: 'bg-blue-600', active: true },
];

const INITIAL_CHANNELS = [
    { id: 'ch1', platform: 'youtube', name: 'Incrix Tech', link: 'https://youtube.com/@incrixtech', email: 'tech@incrix.com', credentials: 'Password123!' },
    { id: 'ch2', platform: 'instagram', name: 'Incrix Life', link: 'https://instagram.com/incrixlife', email: 'social@incrix.com', credentials: 'SecurePassword!' },
    { id: 'ch3', platform: 'whatsapp', name: 'Core Team', link: 'https://chat.whatsapp.com/invite/12345', email: 'Incrix Bot', credentials: 'API_KEY_123' }
];

const INITIAL_PROJECTS = [
    {
        id: 'VID-001',
        title: 'Q3 Product Update',
        topic: 'New Features Walkthrough',
        vertical: 'software',
        platform: 'youtube',
        channelId: 'ch1',
        role: 'creator',
        creator: 'Abishek',
        editor: 'Mike T.',
        stage: 'Scripting',
        status: 'In Progress',
        priority: 'High',
        lastUpdated: Date.now(),
        dueDate: Date.now() + 86400000,
        durationMinutes: 0,
        script: '',
        tasks: [],
        technicalNotes: '',
        comments: [],
        hasMographNeeds: false,
        archived: false
    },
    {
        id: 'VID-002',
        title: 'Behind the Scenes',
        topic: 'Office Culture',
        vertical: 'branding',
        platform: 'instagram',
        channelId: 'ch2',
        role: 'editor',
        creator: 'Manisha',
        editor: 'Mike T.',
        stage: 'Editing',
        status: 'In Progress',
        priority: 'Medium',
        lastUpdated: Date.now() - (50 * 60 * 60 * 1000), // Stuck
        dueDate: Date.now() + 172800000,
        durationMinutes: 0,
        script: '',
        tasks: [],
        technicalNotes: '',
        comments: [],
        hasMographNeeds: true,
        archived: false
    }
];

// Schema Definition (Single JSON Model) - Same as server.js
const studioStateSchema = new mongoose.Schema({
    users: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    channels: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
}, { strict: false });

const StudioState = mongoose.model('StudioState', studioStateSchema);

async function seed() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Check if data exists
        let state = await StudioState.findOne();
        if (state) {
            console.log('Existing state found. Overwriting with simplified master/sample data...');
            state.users = INITIAL_USERS;
            state.projects = INITIAL_PROJECTS;
            state.channels = INITIAL_CHANNELS;
            state.lastUpdated = new Date();
        } else {
            console.log('No state found. Creating new master state...');
            state = new StudioState({
                users: INITIAL_USERS,
                projects: INITIAL_PROJECTS,
                channels: INITIAL_CHANNELS
            });
        }

        await state.save();
        console.log('Database successfully seeded with Sample Master JSON!');
        process.exit(0);

    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
}

seed();
