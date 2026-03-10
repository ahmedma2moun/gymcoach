import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import User from './models/User.js';
import Plan from './models/Plan.js';
import Exercise from './models/Exercise.js';

const app = express();
const PORT = 3000;

// Exercises excluded from history tracking
const EXCLUDED_EXERCISES = ['Dynamic stretches', 'Static stretches'];

app.use(cors());
app.use(express.json());

// Ensure DB is connected before handling any request (serverless cold-start safe)
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    } catch (e) {
        next(e);
    }
});

// --- Auth ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Escape regex metacharacters to prevent injection
        const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${escaped}$`, 'i') }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check active status before expensive bcrypt comparison
        if (user.isActive === false) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const { password: _, ...userWithoutPass } = user.toObject();
        res.json(userWithoutPass);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// --- Users (Admin only) ---
app.get('/api/users', async (_req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, password, role = 'user' } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({
            id: Date.now(),
            username,
            password,
            role,
            isActive: true
        });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            isActive: newUser.isActive
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.patch('/api/users/:id/status', async (req, res) => {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error updating user status' });
    }
});

// --- Plans ---
app.get('/api/plans/:userId', async (req, res) => {
    try {
        const plans = await Plan.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(plans);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching plans' });
    }
});

app.post('/api/plans', async (req, res) => {
    const { userId, title, exercises, date } = req.body;
    if (!userId || !title || !Array.isArray(exercises)) {
        return res.status(400).json({ message: 'userId, title, and exercises are required' });
    }

    try {
        const newPlan = await Plan.create({
            id: Date.now(),
            userId,
            title,
            date,
            status: 'active',
            exercises: exercises.map(ex => ({
                ...ex,
                done: false,
                coachNote: ex.coachNote || '',
                supersetId: ex.supersetId || null
            }))
        });
        res.status(201).json(newPlan);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error creating plan' });
    }
});

app.delete('/api/plans/:planId', async (req, res) => {
    try {
        const result = await Plan.deleteOne({ id: req.params.planId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json({ message: 'Plan deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error deleting plan' });
    }
});

app.put('/api/plans/:planId', async (req, res) => {
    const { title, exercises } = req.body;
    if (!title || !Array.isArray(exercises)) {
        return res.status(400).json({ message: 'title and exercises are required' });
    }

    try {
        const plan = await Plan.findOneAndUpdate(
            { id: req.params.planId },
            {
                $set: {
                    title,
                    exercises: exercises.map(ex => ({
                        name: ex.name,
                        videoUrl: ex.videoUrl,
                        sets: ex.sets,
                        reps: ex.reps,
                        weight: ex.weight || '',
                        weightKg: ex.weightKg || '',
                        weightLbs: ex.weightLbs || '',
                        done: ex.done || false,
                        completedAt: ex.completedAt || null,
                        coachNote: ex.coachNote || '',
                        userNote: ex.userNote || '',
                        supersetId: ex.supersetId || null
                    }))
                }
            },
            { new: true }
        );
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error updating plan' });
    }
});

// Clone plan to another user — must be defined before /:planId PATCH to avoid route shadowing
app.post('/api/plans/clone', async (req, res) => {
    const { planId, targetUserId, date } = req.body;
    if (!planId || !targetUserId) {
        return res.status(400).json({ message: 'planId and targetUserId are required' });
    }

    try {
        const originalPlan = await Plan.findOne({ id: planId });
        if (!originalPlan) {
            return res.status(404).json({ message: 'Original plan not found' });
        }

        const newPlan = await Plan.create({
            id: Date.now(),
            userId: targetUserId,
            title: originalPlan.title,
            date,
            status: 'active',
            exercises: originalPlan.exercises.map(ex => ({
                name: ex.name,
                videoUrl: ex.videoUrl,
                sets: ex.sets,
                reps: ex.reps,
                coachNote: ex.coachNote || '',
                supersetId: ex.supersetId || null,
                done: false,
                weight: '',
                weightKg: '',
                weightLbs: '',
                userNote: ''
            }))
        });

        res.status(201).json(newPlan);
    } catch (e) {
        console.error('Error cloning plan:', e);
        res.status(500).json({ message: 'Error cloning plan' });
    }
});

// Mark exercise as done/undone
app.patch('/api/plans/:planId', async (req, res) => {
    const { exerciseIndex, done, weight, weightKg, weightLbs, userNote } = req.body;

    if (typeof exerciseIndex !== 'number' || typeof done !== 'boolean') {
        return res.status(400).json({ message: 'exerciseIndex (number) and done (boolean) are required' });
    }

    try {
        const setFields = {
            [`exercises.${exerciseIndex}.done`]: done,
            [`exercises.${exerciseIndex}.completedAt`]: done ? new Date() : null,
        };
        if (weight !== undefined) setFields[`exercises.${exerciseIndex}.weight`] = weight;
        if (weightKg !== undefined) setFields[`exercises.${exerciseIndex}.weightKg`] = weightKg;
        if (weightLbs !== undefined) setFields[`exercises.${exerciseIndex}.weightLbs`] = weightLbs;
        if (userNote !== undefined) setFields[`exercises.${exerciseIndex}.userNote`] = userNote;

        // Filter ensures exerciseIndex exists — returns null if plan not found or index out of bounds
        const plan = await Plan.findOneAndUpdate(
            { id: req.params.planId, [`exercises.${exerciseIndex}`]: { $exists: true } },
            { $set: setFields },
            { new: true }
        );
        if (!plan) return res.status(404).json({ message: 'Plan not found or exercise index out of bounds' });
        res.json(plan);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error updating plan' });
    }
});

// Get all exercise history for a user (for history tab with graphs)
app.get('/api/plans/user/:userId/exercise-history', async (req, res) => {
    try {
        const { userId } = req.params;
        const plans = await Plan.find({ userId })
            .sort({ date: -1 })
            .select('date exercises.name exercises.done exercises.completedAt exercises.weightKg exercises.weightLbs exercises.weight exercises.userNote -_id');

        const historyMap = {};

        for (const plan of plans) {
            for (const exercise of plan.exercises) {
                if (!exercise.done || EXCLUDED_EXERCISES.includes(exercise.name)) continue;

                if (!historyMap[exercise.name]) historyMap[exercise.name] = [];

                historyMap[exercise.name].push({
                    date: exercise.completedAt || plan.date,
                    weightKg: exercise.weightKg || '',
                    weightLbs: exercise.weightLbs || '',
                    weight: exercise.weight || '',
                    userNote: exercise.userNote || ''
                });
            }
        }

        res.json(historyMap);
    } catch (e) {
        console.error('Error fetching exercise history:', e);
        res.status(500).json({ message: 'Error fetching exercise history' });
    }
});

// Get previous weight and note for a specific exercise
app.get('/api/plans/user/:userId/exercise-history/:exerciseName', async (req, res) => {
    try {
        const { userId, exerciseName } = req.params;

        // Aggregation pushes filtering into the DB — stops at first matching exercise
        const [result] = await Plan.aggregate([
            { $match: { userId: Number(userId) } },
            { $sort: { date: -1 } },
            { $unwind: '$exercises' },
            { $match: { 'exercises.name': exerciseName, 'exercises.done': true } },
            { $limit: 1 },
            {
                $project: {
                    _id: 0,
                    weight: { $ifNull: ['$exercises.weight', null] },
                    weightKg: { $ifNull: ['$exercises.weightKg', null] },
                    weightLbs: { $ifNull: ['$exercises.weightLbs', null] },
                    lastComment: { $ifNull: ['$exercises.userNote', ''] }
                }
            }
        ]);

        res.json(result ?? { weight: null, weightKg: null, weightLbs: null, lastComment: '' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching exercise history' });
    }
});

// --- Exercise Library ---
app.get('/api/exercises', async (_req, res) => {
    try {
        const exercises = await Exercise.find({}).sort({ name: 1 });
        res.json(exercises);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching exercises' });
    }
});

app.post('/api/exercises', async (req, res) => {
    const { name, videoUrl } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'name is required' });
    }

    try {
        const newExercise = await Exercise.create({
            id: Date.now(),
            name,
            videoUrl: videoUrl || ''
        });
        res.status(201).json(newExercise);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error creating exercise' });
    }
});

app.put('/api/exercises/:id', async (req, res) => {
    const { name, videoUrl } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'name is required' });
    }

    try {
        const exercise = await Exercise.findOneAndUpdate(
            { id: req.params.id },
            { name, videoUrl },
            { new: true }
        );

        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
        res.json(exercise);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error updating exercise' });
    }
});

app.delete('/api/exercises/:id', async (req, res) => {
    try {
        const result = await Exercise.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        res.json({ message: 'Exercise deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error deleting exercise' });
    }
});

// Create default admin account on first boot (lazy, non-blocking)
const ensureAdmin = async () => {
    try {
        await connectDB();
        const admin = await User.findOne({ username: 'admin' });
        if (!admin) {
            await User.create({ id: 1, username: 'admin', password: 'admin', role: 'admin', isActive: true });
            console.log('Default admin created — change this password immediately!');
        }
    } catch (e) {
        console.error('ensureAdmin failed:', e.message);
    }
};
ensureAdmin();

// Export app for Vercel serverless
export default app;

// Start local server when run directly
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
