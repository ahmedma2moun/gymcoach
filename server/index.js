import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { User } from './models/User.js';
import { Plan } from './models/Plan.js';
import { Exercise } from './models/Exercise.js';
import { runExportJob } from './export/job.js';

// Prisma returns BIGINT columns as BigInt — teach JSON how to serialize them
BigInt.prototype.toJSON = function () { return this.toString(); };

const app = express();
const PORT = 3000;

// Exercises excluded from history tracking
const EXCLUDED_EXERCISES = ['Dynamic stretches', 'Static stretches'];

app.use(cors());
app.use(express.json());

// --- Auth ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const user = await User.findByUsernameCI(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const { password: _, ...userWithoutPass } = user;
        res.json(userWithoutPass);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// --- Users (Admin only) ---
app.get('/api/users', async (_req, res) => {
    try {
        const users = await User.findAll();
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
        const existing = await User.findByUsername(username);
        if (existing) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({ id: Date.now(), username, password, role, isActive: true });
        res.status(201).json(newUser);
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
        const user = await User.updateStatus(Number(req.params.id), isActive);
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
        const plans = await Plan.findByUserId(Number(req.params.userId));
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
        const result = await Plan.deleteById(Number(req.params.planId));
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
        const plan = await Plan.updateById(Number(req.params.planId), {
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
        });
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
        const original = await Plan.findById(Number(planId));
        if (!original) {
            return res.status(404).json({ message: 'Original plan not found' });
        }

        const newPlan = await Plan.create({
            id: Date.now(),
            userId: targetUserId,
            title: original.title,
            date,
            status: 'active',
            exercises: original.exercises.map(ex => ({
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
        const plan = await Plan.updateExercise(
            Number(req.params.planId),
            exerciseIndex,
            { done, weight, weightKg, weightLbs, userNote }
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
        const rows = await Plan.getExerciseHistoryRows(Number(req.params.userId));

        const historyMap = {};
        for (const row of rows) {
            if (!row.done || EXCLUDED_EXERCISES.includes(row.name)) continue;
            if (!historyMap[row.name]) historyMap[row.name] = [];
            historyMap[row.name].push({
                date: row.completed_at || row.date,
                weightKg: row.weight_kg || '',
                weightLbs: row.weight_lbs || '',
                weight: row.weight || '',
                userNote: row.user_note || ''
            });
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
        const result = await Plan.getLastExercise(
            Number(req.params.userId),
            req.params.exerciseName
        );
        res.json(result ?? { weight: null, weightKg: null, weightLbs: null, lastComment: '' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching exercise history' });
    }
});

// --- Exercise Library ---
app.get('/api/exercises', async (_req, res) => {
    try {
        const exercises = await Exercise.findAll();
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
        const newExercise = await Exercise.create({ id: Date.now(), name, videoUrl: videoUrl || '' });
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
        const exercise = await Exercise.updateById(Number(req.params.id), { name, videoUrl: videoUrl || '' });
        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
        res.json(exercise);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error updating exercise' });
    }
});

app.delete('/api/exercises/:id', async (req, res) => {
    try {
        const result = await Exercise.deleteById(Number(req.params.id));
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
        const admin = await User.findByUsername('admin');
        if (!admin) {
            await User.create({ id: 1, username: 'admin', password: 'admin', role: 'admin', isActive: true });
            console.log('Default admin created — change this password immediately!');
        }
    } catch (e) {
        console.error('ensureAdmin failed:', e.message);
    }
};

// ---------------------------------------------------------------------------
// GET /api/export/run
// Triggers the daily export job on demand.
//
// Security: requires one of:
//   Authorization: Bearer <CRON_SECRET>        — set automatically by Vercel Cron
//   Authorization: Bearer <EXPORT_TRIGGER_SECRET> — for manual HTTP invocations
//
// Returns 202 immediately; job runs async so Vercel's 60 s function limit
// is not an issue for the HTTP response (job logs go to stdout).
// ---------------------------------------------------------------------------
app.get('/api/export/run', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const cronSecret = process.env.CRON_SECRET;
    const triggerSecret = process.env.EXPORT_TRIGGER_SECRET;

    const authorized =
        (cronSecret    && authHeader === `Bearer ${cronSecret}`)    ||
        (triggerSecret && authHeader === `Bearer ${triggerSecret}`);

    if (!authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const correlationId = Date.now().toString(36);
    res.status(202).json({ accepted: true, correlationId });

    // Fire-and-forget so the HTTP response is not blocked by the job duration
    runExportJob({ correlationId }).catch(err => {
        console.error(JSON.stringify({
            ts: new Date().toISOString(),
            correlationId,
            level: 'error',
            msg: 'export job error after 202',
            error: err.message,
        }));
    });
});

// Export app for Vercel serverless
export default app;

// Start local server when run directly
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    ensureAdmin();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
