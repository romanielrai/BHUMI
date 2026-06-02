import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/prisma-client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const [adminRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Admin access to manage clients and analytics' }
    }),
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Full platform access' }
    }),
    prisma.role.upsert({
      where: { name: 'CLIENT' },
      update: {},
      create: { name: 'CLIENT', description: 'Client access to dashboard and reports' }
    })
  ]);

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'AdminPass123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@aigrowthsystems.com' },
    update: { passwordHash, roleId: adminRole.id },
    create: {
      email: 'admin@aigrowthsystems.com',
      name: 'Admin User',
      passwordHash,
      roleId: adminRole.id
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
