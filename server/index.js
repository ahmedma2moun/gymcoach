import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './db.js';
import User from './models/User.js';
import Plan from './models/Plan.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Init DB
connectDB();

// Create default admin on startup would require checking DB
// We can do this lazily or in a script. For now, let's just ensure connection.

// --- Auth ---
app.post('/api/login', async (req, res) => {
    await connectDB();
    const { username, password } = req.body;
    try {
        // Case-insensitive search for username
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${username}$`, 'i') },
            password
        });
        if (user) {
            const { password: _, ...userWithoutPass } = user.toObject();
            res.json(userWithoutPass);
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (e) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

// --- Users (Admin only) ---
app.get('/api/users', async (req, res) => {
    await connectDB();
    const users = await User.find({}, '-password'); // Exclude password
    res.json(users);
});

app.post('/api/users', async (req, res) => {
    await connectDB();
    const { username, password, role = 'user' } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({
            id: Date.now(), // Keeping numeric ID logic for now
            username,
            password,
            role
        });

        res.json({ id: newUser.id, username: newUser.username, role: newUser.role });
    } catch (e) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

// --- Plans ---
app.get('/api/plans/:userId', async (req, res) => {
    await connectDB();
    const plans = await Plan.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(plans);
});

app.post('/api/plans', async (req, res) => {
    await connectDB();
    const { userId, title, exercises, date } = req.body;

    try {
        const newPlan = await Plan.create({
            id: Date.now(),
            userId,
            title,
            date,
            status: 'active',
            exercises: exercises.map(ex => ({ ...ex, done: false }))
        });
        res.json(newPlan);
    } catch (e) {
        res.status(500).json({ message: 'Error creating plan' });
    }
});

// Mark exercise as done/undone
app.patch('/api/plans/:planId', async (req, res) => {
    await connectDB();
    const { exerciseIndex, done } = req.body;

    try {
        // Mongoose doesn't support array index update easily with finding by ID first
        // Simple way: retrieve, modify, save
        const plan = await Plan.findOne({ id: req.params.planId });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        if (plan.exercises[exerciseIndex]) {
            plan.exercises[exerciseIndex].done = done;
            await plan.save();
            res.json(plan);
        } else {
            res.status(400).json({ message: 'Exercise not found' });
        }
    } catch (e) {
        res.status(500).json({ message: 'Error updating plan' });
    }
});

// --- Default Admin Script (Auto-run on request if missing) ---
// Note: In a real app, this should be a seed script.
const ensureAdmin = async () => {
    await connectDB();
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
        await User.create({ id: 1, username: 'admin', password: 'admin', role: 'admin' });
        console.log('Default admin created (Mongo)');
    }
};
// Trigger check asynchronously
ensureAdmin();


// Export app for Vercel
export default app;

/* eslint-disable no-undef */
// Only listen if run directly (not imported as a module)
if (process.env.NODE_ENV !== 'production' || process.argv[1].endsWith('index.js')) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
/* eslint-enable no-undef */
