import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.user.findUnique({
        where: { username: 'admin' }
    });

    if (existing) {
        console.log('Admin user already exists — skipping seed.');
        return;
    }

    const hashed = await bcrypt.hash('admin', 10);

    await prisma.user.create({
        data: {
            id: BigInt(Date.now()),
            username: 'admin',
            password: hashed,
            role: 'admin',
            isActive: true
        }
    });

    console.log('Admin user created (username: admin, password: admin)');
    console.log('IMPORTANT: Change the admin password immediately after first login.');
}

main()
    .catch(err => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
