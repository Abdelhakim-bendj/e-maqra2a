import { PrismaClient, Role, TaskType, SessionType, ExamType, QuestionType } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Ensure we have Supabase service role key for admin auth operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://cdrlhdwlgvgwqwoewvac.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearData() {
  console.log('🧹 Clearing old Prisma data...');
  // Delete in correct order to respect foreign keys
  await prisma.attendance.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.examSubmission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.memorizationSubmission.deleteMany();
  await prisma.memorizationTask.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.class.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.profile.deleteMany();
  console.log('✅ Prisma data cleared.');
}

async function createSupabaseUser(email: string, password: string, fullName: string, role: Role) {
  // Check if user exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  
  let user = usersData.users.find(u => u.email === email);
  
  if (user) {
    console.log(`ℹ️ User ${email} already exists in Supabase. Using existing.`);
    // Optionally update password to ensure it's known
    await supabase.auth.admin.updateUserById(user.id, { password });
  } else {
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    });
    if (error) throw error;
    user = authData.user;
    console.log(`✅ Created Supabase Auth user: ${email}`);
  }
  return user.id;
}

async function main() {
  console.log('🌱 Starting database seeding...');
  await clearData();

  const defaultPassword = 'Password123!';

  // 1. Create Admin
  const adminId = await createSupabaseUser('bendjelloulabedelhakim@gmail.com', defaultPassword, 'مدير النظام', Role.ADMIN);
  const admin = await prisma.profile.create({
    data: {
      id: adminId,
      email: 'bendjelloulabedelhakim@gmail.com',
      fullName: 'مدير النظام',
      role: Role.ADMIN,
      phone: '0500000001',
    },
  });
  console.log('✅ Admin profile created');

  // 2. Create 1 Teacher
  const teacherId = await createSupabaseUser('teacher1@emaqra2a.com', defaultPassword, 'المعلم الأول', Role.TEACHER);
  const teacher = await prisma.profile.create({
    data: {
      id: teacherId,
      email: 'teacher1@emaqra2a.com',
      fullName: 'المعلم الأول',
      role: Role.TEACHER,
      phone: '0500000101',
    },
  });
  console.log(`✅ Teacher created`);

  // 3. Create Class
  const class1 = await prisma.class.create({
    data: {
      name: 'حلقة الحفظ - المجموعة الأولى',
      description: 'حلقة تحفيظ ومراجعة القرآن الكريم بإشراف المعلم الأول',
      teacherId: teacher.id,
    },
  });
  console.log(`✅ Class created`);

  // 4. Create 2 Students
  const students = [];
  for (let s = 1; s <= 2; s++) {
    const email = `student${s}@emaqra2a.com`;
    const sId = await createSupabaseUser(email, defaultPassword, `طالب ${s}`, Role.STUDENT);
    const student = await prisma.profile.create({
      data: {
        id: sId,
        email: email,
        fullName: `طالب ${s}`,
        role: Role.STUDENT,
        phone: `050000100${s}`,
        studentProfile: {
          create: {
            currentJuz: 30,
            currentSurah: 78,
            teacherId: teacher.id,
            classId: class1.id,
          },
        },
      },
    });
    students.push(student);
  }
  console.log(`✅ 2 Students created and assigned`);

  // 5. Create Live Sessions
  await prisma.liveSession.create({
    data: {
      title: `حلقة البث المباشر الأسبوعية - ${teacher.fullName}`,
      sessionType: SessionType.MEMORIZATION,
      teacherId: teacher.id,
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      durationMinutes: 60,
      maxParticipants: 15,
      meetingUrl: 'https://meet.google.com/test-url',
    }
  });
  console.log(`✅ Live Sessions created`);

  // 6. Create Exams
  await prisma.exam.create({
    data: {
      title: `اختبار منتصف الشهر - ${teacher.fullName}`,
      examType: ExamType.MONTHLY,
      teacherId: teacher.id,
      startTime: new Date(),
      endTime: new Date(Date.now() + 86400000 * 3), // 3 days from now
      timeLimitMinutes: 45,
      passingScore: 70,
      status: 'PUBLISHED',
      questions: {
        create: [
          {
            questionType: QuestionType.MULTIPLE_CHOICE,
            questionText: 'ما هي أطول سورة في القرآن الكريم؟',
            options: ['سورة البقرة', 'سورة آل عمران', 'سورة النساء'],
            correctAnswer: 'سورة البقرة',
            points: 5,
            orderIndex: 1,
          }
        ]
      }
    }
  });
  console.log(`✅ Exams created`);

  console.log('🎉 Seeding finished successfully!');
  console.log('----------------------------------------------------');
  console.log(' credentials:');
  console.log(' - Admin: bendjelloulabedelhakim@gmail.com / Password123!');
  console.log(' - Teacher: teacher1@emaqra2a.com / Password123!');
  console.log(' - Student 1: student1@emaqra2a.com / Password123!');
  console.log(' - Student 2: student2@emaqra2a.com / Password123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
