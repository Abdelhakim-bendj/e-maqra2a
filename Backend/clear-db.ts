import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Starting database cleanup...');
  try {
    // We must delete child tables first to avoid foreign key constraint errors
    await prisma.$transaction([
      prisma.auditLog.deleteMany(),
      prisma.attendance.deleteMany(),
      prisma.answer.deleteMany(),
      prisma.assessment.deleteMany(),
      prisma.memorizationSubmission.deleteMany(),
      prisma.examSubmission.deleteMany(),
      prisma.question.deleteMany(),
      prisma.exam.deleteMany(),
      prisma.memorizationTask.deleteMany(),
      prisma.studentProfile.deleteMany(),
      prisma.class.deleteMany(),
      prisma.liveSession.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.message.deleteMany(),
      prisma.tajweedLesson.deleteMany(),
      prisma.islamicContent.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.passwordResetToken.deleteMany(),
      prisma.user.deleteMany(), // Delete users last
    ]);
    
    console.log('✅ Database cleared successfully! All records have been deleted.');
  } catch (error) {
    console.error('❌ Failed to clear database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
