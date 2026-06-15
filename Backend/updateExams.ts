import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.exam.updateMany({
    where: { status: 'DRAFT' },
    data: { status: 'PUBLISHED' },
  });
  console.log(`Updated ${result.count} exams to PUBLISHED.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
