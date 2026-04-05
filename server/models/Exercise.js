import prisma from '../db.js';

export const Exercise = {
    /** All exercises sorted by name. */
    async findAll() {
        return prisma.exercise.findMany({ orderBy: { name: 'asc' } });
    },

    /** Create a new exercise. */
    async create({ id, name, videoUrl = '' }) {
        return prisma.exercise.create({
            data: { id: BigInt(id), name, videoUrl }
        });
    },

    /** Update name and videoUrl. Returns null if not found. */
    async updateById(id, { name, videoUrl = '' }) {
        try {
            return await prisma.exercise.update({
                where: { id: BigInt(id) },
                data: { name, videoUrl }
            });
        } catch {
            return null;
        }
    },

    /** Delete by id. Returns { deletedCount }. */
    async deleteById(id) {
        try {
            await prisma.exercise.delete({ where: { id: BigInt(id) } });
            return { deletedCount: 1 };
        } catch {
            return { deletedCount: 0 };
        }
    }
};
