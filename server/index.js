import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './db.js';
import User from './models/User.js';
import Plan from './models/Plan.js';
import Exercise from './models/Exercise.js';

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
            username: { $regex: new RegExp(`^${username}$`, 'i') }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const { password: _, ...userWithoutPass } = user.toObject();
        res.json(userWithoutPass);

    } catch (e) {
        console.error(e);
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
            role,
            isActive: true
        });

        res.json({ id: newUser.id, username: newUser.username, role: newUser.role, isActive: newUser.isActive });
    } catch (e) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.patch('/api/users/:id/status', async (req, res) => {
    await connectDB();
    const { isActive } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ message: 'Error updating user status' });
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
            exercises: exercises.map(ex => ({
                ...ex,
                done: false,
                coachNote: ex.coachNote || '',
                supersetId: ex.supersetId || null
            }))
        });
        res.json(newPlan);
    } catch (e) {
        res.status(500).json({ message: 'Error creating plan' });
    }
});

app.delete('/api/plans/:planId', async (req, res) => {
    await connectDB();
    try {
        const result = await Plan.deleteOne({ id: req.params.planId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json({ message: 'Plan deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting plan' });
    }
});

app.put('/api/plans/:planId', async (req, res) => {
    await connectDB();
    const { title, exercises } = req.body;
    try {
        const plan = await Plan.findOne({ id: req.params.planId });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        plan.title = title;
        // Preserve existing done/weight status if possible, or reset?
        // Usually, admin editing a plan might want to keep existing exercises that match?
        // But simplifying: fully replace exercises with new list, but keeping structure.
        // If we strictly replace, user history on that specific plan instance (done status) is lost if we don't map it back.
        // However, looking at the Admin logic, it sends the full exercise objects back.
        // Let's see what AdminDashboard sends. It sends `planForm.exercises`.
        // If the admin edits an existing plan, they might be adding/removing exercises.
        // The safest approach for a simple specific plan update is to replace the exercises list with the new one.
        // Warning: This resets 'done' status if the frontend sends clean objects.
        // Let's check AdminDashboard `handleSavePlan` body:
        // const body = isEditing ? { title: planForm.title, exercises: planForm.exercises } : ...
        // And `planForm` is initialized from `userPlans`.
        // So `planForm.exercises` has the current state of exercises (including done status if loaded from DB).
        // So we can blindly save what comes in, BUT we must ensure we sanitize/map correctly to match schema.

        plan.exercises = exercises.map(ex => ({
            name: ex.name,
            videoUrl: ex.videoUrl,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight || '',
            weightKg: ex.weightKg || '',
            weightLbs: ex.weightLbs || '',
            done: ex.done || false,
            coachNote: ex.coachNote || '',
            userNote: ex.userNote || '',
            supersetId: ex.supersetId || null
        }));

        await plan.save();
        res.json(plan);
    } catch (e) {
        res.status(500).json({ message: 'Error updating plan' });
    }
});

// Mark exercise as done/undone
app.patch('/api/plans/:planId', async (req, res) => {
    await connectDB();
    const { exerciseIndex, done, weight, weightKg, weightLbs, userNote } = req.body;

    try {
        const plan = await Plan.findOne({ id: req.params.planId });

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        if (plan.exercises[exerciseIndex]) {
            plan.exercises[exerciseIndex].done = done;
            if (weight !== undefined) plan.exercises[exerciseIndex].weight = weight;
            if (weightKg !== undefined) plan.exercises[exerciseIndex].weightKg = weightKg;
            if (weightLbs !== undefined) plan.exercises[exerciseIndex].weightLbs = weightLbs;
            if (userNote !== undefined) plan.exercises[exerciseIndex].userNote = userNote;

            await plan.save();
            res.json(plan);
        } else {
            res.status(400).json({ message: 'Exercise not found' });
        }
    } catch (e) {
        res.status(500).json({ message: 'Error updating plan' });
    }
});

// Get ALL exercise history for a user (for history tab with graphs)
app.get('/api/plans/user/:userId/exercise-history', async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;

        const plans = await Plan.find({ userId }).sort({ date: 1 }); // Sort by date ascending for chronological order

        // Build a map: exerciseName -> array of { date, weightKg, weightLbs, weight, userNote }
        const historyMap = {};

        for (const plan of plans) {
            for (const exercise of plan.exercises) {
                if (exercise.done) {
                    if (!historyMap[exercise.name]) {
                        historyMap[exercise.name] = [];
                    }

                    historyMap[exercise.name].push({
                        date: plan.date,
                        weightKg: exercise.weightKg || '',
                        weightLbs: exercise.weightLbs || '',
                        weight: exercise.weight || '',
                        userNote: exercise.userNote || ''
                    });
                }
            }
        }

        res.json(historyMap);
    } catch (e) {
        console.error('Error fetching exercise history:', e);
        res.status(500).json({ message: 'Error fetching exercise history' });
    }
});

// Get previous weight and comment for an exercise
app.get('/api/plans/user/:userId/exercise-history/:exerciseName', async (req, res) => {
    await connectDB();
    try {
        const { userId, exerciseName } = req.params;

        const plans = await Plan.find({ userId }).sort({ date: -1 });

        for (const plan of plans) {
            for (const exercise of plan.exercises) {
                // Check if done. Prefer weightKg/Lbs if available, fallback to legacy weight
                if (exercise.name === exerciseName && exercise.done) {
                    const result = { weight: null, weightKg: null, weightLbs: null, lastComment: exercise.userNote || '' };

                    if (exercise.weightKg || exercise.weightLbs) {
                        result.weightKg = exercise.weightKg;
                        result.weightLbs = exercise.weightLbs;
                        return res.json(result);
                    }
                    if (exercise.weight) {
                        result.weight = exercise.weight;
                        return res.json(result);
                    }
                    // If no weight but has note, we might want to keep looking for weight?
                    // Or just return what we have? Let's return the most recent done instance regardless.
                    return res.json(result);
                }
            }
        }

        res.json({ weight: null, weightKg: null, weightLbs: null, lastComment: '' });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching exercise history' });
    }
});

// --- Exercise Library ---
app.get('/api/exercises', async (req, res) => {
    await connectDB();
    try {
        const exercises = await Exercise.find({}).sort({ name: 1 });
        res.json(exercises);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching exercises' });
    }
});

app.post('/api/exercises', async (req, res) => {
    await connectDB();
    const { name, videoUrl } = req.body;

    try {
        const newExercise = await Exercise.create({
            id: Date.now(),
            name,
            videoUrl: videoUrl || ''
        });
        res.json(newExercise);
    } catch (e) {
        res.status(500).json({ message: 'Error creating exercise' });
    }
});

app.put('/api/exercises/:id', async (req, res) => {
    await connectDB();
    const { name, videoUrl } = req.body;

    try {
        const exercise = await Exercise.findOneAndUpdate(
            { id: req.params.id },
            { name, videoUrl },
            { new: true }
        );

        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
        res.json(exercise);
    } catch (e) {
        res.status(500).json({ message: 'Error updating exercise' });
    }
});

app.delete('/api/exercises/:id', async (req, res) => {
    await connectDB();
    try {
        const result = await Exercise.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Exercise not found' });
        }
        res.json({ message: 'Exercise deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting exercise' });
    }
});

// --- Default Admin Script (Auto-run on request if missing) ---
// Note: In a real app, this should be a seed script.
const ensureAdmin = async () => {
    await connectDB();
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
        await User.create({ id: 1, username: 'admin', password: 'admin', role: 'admin', isActive: true });
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
