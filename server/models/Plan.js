import prisma from '../db.js';

// Exercises excluded from history tracking
const EXCLUDED_EXERCISES = ['Dynamic stretches', 'Static stretches'];

/** Prisma include clause that always loads exercises in order. */
const WITH_EXERCISES = {
    exercises: { orderBy: { exerciseOrder: 'asc' } }
};

/**
 * Prisma returns BigInt for id/userId/planId — serialize to number for JSON.
 * Also flattens the nested `exercises` relation to match the old API shape.
 */
function serializePlan(plan) {
    return {
        ...plan,
        id: Number(plan.id),
        userId: Number(plan.userId),
        exercises: (plan.exercises ?? []).map(ex => ({
            ...ex,
            planId: Number(ex.planId)
        }))
    };
}

export const Plan = {
    /** All plans for a user, newest first, with exercises. */
    async findByUserId(userId) {
        const plans = await prisma.plan.findMany({
            where: { userId: BigInt(userId) },
            orderBy: { date: 'desc' },
            include: WITH_EXERCISES
        });
        return plans.map(serializePlan);
    },

    /** Single plan with exercises. */
    async findById(planId) {
        const plan = await prisma.plan.findUnique({
            where: { id: BigInt(planId) },
            include: WITH_EXERCISES
        });
        return plan ? serializePlan(plan) : null;
    },

    /** Create plan + exercises in one transaction. */
    async create({ id, userId, title, date, status = 'active', exercises }) {
        const plan = await prisma.plan.create({
            data: {
                id: BigInt(id),
                userId: BigInt(userId),
                title,
                date: date ? new Date(date) : null,
                status,
                exercises: {
                    create: exercises.map((ex, i) => ({
                        exerciseOrder: i,
                        name: ex.name ?? '',
                        sets: ex.sets ?? '',
                        reps: ex.reps ?? '',
                        videoUrl: ex.videoUrl ?? '',
                        done: ex.done ?? false,
                        completedAt: ex.completedAt ? new Date(ex.completedAt) : null,
                        weight: ex.weight ?? '',
                        weightKg: ex.weightKg ?? '',
                        weightLbs: ex.weightLbs ?? '',
                        coachNote: ex.coachNote ?? '',
                        userNote: ex.userNote ?? '',
                        supersetId: ex.supersetId ?? null
                    }))
                }
            },
            include: WITH_EXERCISES
        });
        return serializePlan(plan);
    },

    /** Delete plan by id (exercises cascade). Returns { deletedCount }. */
    async deleteById(planId) {
        try {
            await prisma.plan.delete({ where: { id: BigInt(planId) } });
            return { deletedCount: 1 };
        } catch {
            return { deletedCount: 0 };
        }
    },

    /** Replace title + all exercises atomically. */
    async updateById(planId, { title, exercises }) {
        const bigId = BigInt(planId);
        try {
            const plan = await prisma.$transaction(async (tx) => {
                await tx.plan.update({ where: { id: bigId }, data: { title } });
                await tx.planExercise.deleteMany({ where: { planId: bigId } });
                await tx.planExercise.createMany({
                    data: exercises.map((ex, i) => ({
                        planId: bigId,
                        exerciseOrder: i,
                        name: ex.name ?? '',
                        sets: ex.sets ?? '',
                        reps: ex.reps ?? '',
                        videoUrl: ex.videoUrl ?? '',
                        done: ex.done ?? false,
                        completedAt: ex.completedAt ? new Date(ex.completedAt) : null,
                        weight: ex.weight ?? '',
                        weightKg: ex.weightKg ?? '',
                        weightLbs: ex.weightLbs ?? '',
                        coachNote: ex.coachNote ?? '',
                        userNote: ex.userNote ?? '',
                        supersetId: ex.supersetId ?? null
                    }))
                });
                return tx.plan.findUnique({ where: { id: bigId }, include: WITH_EXERCISES });
            });
            return plan ? serializePlan(plan) : null;
        } catch {
            return null;
        }
    },

    /**
     * Mark a single exercise done/undone and optionally update weight/note.
     * exerciseIndex maps directly to exerciseOrder (0-based).
     */
    async updateExercise(planId, exerciseIndex, { done, weight, weightKg, weightLbs, userNote }) {
        const bigPlanId = BigInt(planId);

        const existing = await prisma.planExercise.findUnique({
            where: { planId_exerciseOrder: { planId: bigPlanId, exerciseOrder: exerciseIndex } }
        });
        if (!existing) return null;

        await prisma.planExercise.update({
            where: { planId_exerciseOrder: { planId: bigPlanId, exerciseOrder: exerciseIndex } },
            data: {
                done,
                completedAt: done ? new Date() : null,
                ...(weight    !== undefined && { weight }),
                ...(weightKg  !== undefined && { weightKg }),
                ...(weightLbs !== undefined && { weightLbs }),
                ...(userNote  !== undefined && { userNote })
            }
        });

        const plan = await prisma.plan.findUnique({
            where: { id: bigPlanId },
            include: WITH_EXERCISES
        });
        return plan ? serializePlan(plan) : null;
    },

    /**
     * All done exercises for a user across all plans (history tab).
     */
    async getExerciseHistoryRows(userId) {
        return prisma.planExercise.findMany({
            where: {
                plan: { userId: BigInt(userId) }
            },
            select: {
                name: true,
                done: true,
                completedAt: true,
                weight: true,
                weightKg: true,
                weightLbs: true,
                userNote: true,
                plan: { select: { date: true } }
            },
            orderBy: { plan: { date: 'desc' } }
        });
    },

    /** Most recent completed entry for a specific exercise name. */
    async getLastExercise(userId, exerciseName) {
        const row = await prisma.planExercise.findFirst({
            where: {
                name: exerciseName,
                done: true,
                plan: { userId: BigInt(userId) }
            },
            select: {
                weight: true,
                weightKg: true,
                weightLbs: true,
                userNote: true,
                completedAt: true,
                plan: { select: { date: true } }
            },
            orderBy: [
                { completedAt: 'desc' },
                { plan: { date: 'desc' } }
            ]
        });

        if (!row) return null;
        return {
            weight: row.weight,
            weightKg: row.weightKg,
            weightLbs: row.weightLbs,
            lastComment: row.userNote
        };
    }
};
