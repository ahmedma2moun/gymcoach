import prisma from '../db.js';
import bcrypt from 'bcryptjs';

/** Strip the password field from a user record. */
function omitPassword({ password, ...rest }) {
    return rest;
}

export const User = {
    /** Find by username (case-insensitive) — includes password for auth. */
    async findByUsernameCI(username) {
        return prisma.user.findFirst({
            where: { username: { equals: username, mode: 'insensitive' } }
        });
    },

    /** Find by exact username — includes password. */
    async findByUsername(username) {
        return prisma.user.findUnique({ where: { username } });
    },

    /** All users, no password. */
    async findAll() {
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        return users.map(omitPassword);
    },

    /** Create user — hashes password before insert. */
    async create({ id, username, password, role = 'user', isActive = true }) {
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { id: BigInt(id), username, password: hashed, role, isActive }
        });
        return omitPassword(user);
    },

    /** Toggle is_active. Returns updated user (no password) or null. */
    async updateStatus(id, isActive) {
        try {
            const user = await prisma.user.update({
                where: { id: BigInt(id) },
                data: { isActive }
            });
            return omitPassword(user);
        } catch {
            return null;
        }
    },

    /** bcrypt comparison helper. */
    async comparePassword(candidatePassword, hashedPassword) {
        return bcrypt.compare(candidatePassword, hashedPassword);
    }
};
