import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: {
      studentProfile: { teacherId: 'some-id' }
    }
  });
  console.log('OK');
}
main();
