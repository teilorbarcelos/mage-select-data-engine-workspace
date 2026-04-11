import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  await prisma.user.deleteMany();

  const users = Array.from({ length: 1543 }).map((_, i) => ({
    name: `User ${(i + 1).toString().padStart(4, '0')}`,
    email: `user${i + 1}@example.com`,
  }));

  for (let i = 0; i < users.length; i += 100) {
    const batch = users.slice(i, i + 100);
    await prisma.user.createMany({
      data: batch,
    });
  }

  console.log(`Seeded ${users.length} users successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
