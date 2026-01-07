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
        // We expect the entire state or partial state in the body
        // For simplicity in this "Single JSON Model" approach, we might update the whole doc
        // Or specific fields if provided.

        let state = await StudioState.findOne();
        if (!state) {
            state = new StudioState(req.body);
        } else {
            if (req.body.users) state.users = req.body.users;
            if (req.body.projects) state.projects = req.body.projects;
            if (req.body.channels) state.channels = req.body.channels;
            state.lastUpdated = Date.now();
        }

        await state.save();
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
