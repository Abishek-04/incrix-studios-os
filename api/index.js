import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (Cached for Serverless)
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in .env');
    }

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected (New Connection)');
        cachedDb = db;
        return db;
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        throw err;
    }
}

// Connect to DB immediately but don't block (mongoose buffers)
connectToDatabase();

// Schema Definition (Single JSON Model)
const studioStateSchema = new mongoose.Schema({
    users: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    channels: { type: Array, default: [] },
    lastUpdated: { type: Date, default: Date.now }
}, { strict: false });

const StudioState = mongoose.models.StudioState || mongoose.model('StudioState', studioStateSchema);

// API Routes

app.get('/api/state', async (req, res) => {
    try {
        await connectToDatabase();
        let state = await StudioState.findOne();
        if (!state) {
            state = new StudioState({});
            await state.save();
        }

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

app.post('/api/login', async (req, res) => {
    try {
        await connectToDatabase();
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

app.post('/api/state', async (req, res) => {
    try {
        await connectToDatabase();
        const { users, projects, channels } = req.body;

        let state = await StudioState.findOne();
        if (!state) {
            state = new StudioState({ users, projects, channels });
        } else {
            if (users && Array.isArray(users)) {
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

// Export the app for Vercel
export default app;
