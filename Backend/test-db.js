const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.islamicContent.count();
    console.log("islamicContent OK");
  } catch (e) {
    console.log("islamicContent FAIL", e.message);
  }
}
main().finally(() => prisma.$disconnect());
