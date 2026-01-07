import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Schema Definition (Single JSON Model)
const studioStateSchema = new mongoose.Schema({
    users: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    channels: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
}, { strict: false }); // Allow flexibility for now since we are storing raw objects

const StudioState = mongoose.model('StudioState', studioStateSchema);

// API Routes

// Get global state (Secured: Removes passwords)
app.get('/api/state', async (req, res) => {
    try {
        let state = await StudioState.findOne();
        if (!state) {
            state = new StudioState({});
            await state.save();
        }

        // Convert to object to modify it without saving
        const stateObj = state.toObject();
        if (stateObj.users) {
            stateObj.users = stateObj.users.map(u => {
                const { password, ...userWithoutPassword } = u;
                return userWithoutPassword;
            });
        }

        res.json(stateObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const state = await StudioState.findOne();

        if (!state || !state.users) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = state.users.find(u => u.email === email && u.password === password);

        if (user) {
            const { password, ...userWithoutPassword } = user;
            res.json({ success: true, user: userWithoutPassword });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update global state
app.post('/api/state', async (req, res) => {
    try {
        const { users, projects, channels } = req.body;

        let state = await StudioState.findOne();
        if (!state) {
            state = new StudioState({ users, projects, channels });
        } else {
            // Smart Merge for Users to preserve passwords not sent by frontend
            if (users && Array.isArray(users)) {
                // Create a map of existing users for fast lookup
                const existingUsersMap = new Map();
                state.users.forEach(u => {
                    if (u.id) existingUsersMap.set(u.id, u);
                });

                const mergedUsers = users.map(newUser => {
                    const existingUser = existingUsersMap.get(newUser.id);
                    if (existingUser && existingUser.password && !newUser.password) {
                        return { ...newUser, password: existingUser.password };
                    }
                    return newUser;
                });
                state.users = mergedUsers;
            }

            if (projects) state.projects = projects;
            if (channels) state.channels = channels;
            state.lastUpdated = new Date();
        }

        await state.save();
        res.json({ success: true, message: 'State updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
