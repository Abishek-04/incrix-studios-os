import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

// Schema Definition (Single JSON Model) - Same as server.js
const studioStateSchema = new mongoose.Schema({
    users: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    channels: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
}, { strict: false });

const StudioState = mongoose.model('StudioState', studioStateSchema);

async function checkUsers() {
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
            console.log('Global State Found.');
            console.log('User Count:', state.users.length);
            state.users.forEach(u => {
                console.log(`- ${u.email} | Password: "${u.password}" | Role: ${u.role}`);
            });
        } else {
            console.log('No state found in DB.');
        }

        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUsers();
