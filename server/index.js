import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { readData, writeData } from './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Init DB files
const initDB = async () => {
    const users = await readData('users.json');
    if (users.length === 0) {
        // Create default admin
        await writeData('users.json', [{ id: 1, username: 'admin', password: 'password', role: 'admin' }]);
        console.log('Default admin created');
    }
};
initDB();

// --- Auth ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readData('users.json');
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const { password: _, ...userWithoutPass } = user;
        res.json(userWithoutPass);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// --- Users (Admin only) ---
app.get('/api/users', async (req, res) => {
    const users = await readData('users.json');
    // Return all users except admin usually, but let's return all for now
    // Filter sensitive data
    const safeUsers = users.map(u => ({ id: u.id, username: u.username, role: u.role }));
    res.json(safeUsers);
});

app.post('/api/users', async (req, res) => {
    const { username, password, role = 'user' } = req.body;
    const users = await readData('users.json');

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = {
        id: Date.now(),
        username,
        password,
        role
    };

    users.push(newUser);
    await writeData('users.json', users);
    res.json({ id: newUser.id, username: newUser.username, role: newUser.role });
});

// --- Plans ---
app.get('/api/plans/:userId', async (req, res) => {
    const plans = await readData('plans.json');
    const userPlans = plans.filter(p => p.userId == req.params.userId); // Abstract equality for string/number safety
    res.json(userPlans);
});

app.post('/api/plans', async (req, res) => {
    const { userId, title, exercises } = req.body;
    // exercises array: { name, sets, reps, done: false }
    const plans = await readData('plans.json');

    const newPlan = {
        id: Date.now(),
        userId,
        title,
        status: 'active',
        exercises: exercises.map(ex => ({ ...ex, done: false })) // Ensure done status init
    };

    plans.push(newPlan);
    await writeData('plans.json', plans);
    res.json(newPlan);
});

// Mark exercise as done/undone
app.patch('/api/plans/:planId', async (req, res) => {
    const { exerciseIndex, done } = req.body;
    const plans = await readData('plans.json');
    const planIndex = plans.findIndex(p => p.id == req.params.planId);

    if (planIndex === -1) {
        return res.status(404).json({ message: 'Plan not found' });
    }

    if (plans[planIndex].exercises[exerciseIndex]) {
        plans[planIndex].exercises[exerciseIndex].done = done;
        await writeData('plans.json', plans);
        res.json(plans[planIndex]);
    } else {
        res.status(400).json({ message: 'Exercise not found' });
    }
});

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
