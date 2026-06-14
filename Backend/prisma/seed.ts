import { PrismaClient, Role, TaskType, SessionType, ExamType, QuestionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@emaqra2a.com' },
    update: {},
    create: {
      email: 'admin@emaqra2a.com',
      fullName: 'مدير النظام',
      passwordHash,
      role: Role.ADMIN,
      phone: '0500000001',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. Create 3 Teachers
  const teachers = [];
  for (let i = 1; i <= 3; i++) {
    const teacher = await prisma.user.upsert({
      where: { email: `teacher${i}@emaqra2a.com` },
      update: {},
      create: {
        email: `teacher${i}@emaqra2a.com`,
        fullName: `المعلم ${i}`,
        passwordHash,
        role: Role.TEACHER,
        phone: `050000010${i}`,
      },
    });
    teachers.push(teacher);
  }
  console.log(`✅ 3 Teachers created`);

  // 3. Create Classes (1 per teacher)
  const classes = [];
  for (let i = 0; i < 3; i++) {
    const teacher = teachers[i];
    const c = await prisma.class.upsert({
      where: { id: `test-class-${i}` },
      update: {},
      create: {
        id: `test-class-${i}`,
        name: `حلقة الحفظ - المجموعة ${i + 1}`,
        description: `حلقة تحفيظ ومراجعة القرآن الكريم بإشراف ${teacher.fullName}`,
        teacherId: teacher.id,
      },
    }).catch(async () => {
      const existingClass = await prisma.class.findFirst({ where: { teacherId: teacher.id } });
      return existingClass || prisma.class.create({
        data: { name: `حلقة الحفظ - المجموعة ${i + 1}`, teacherId: teacher.id }
      });
    });
    classes.push(c);
  }
  console.log(`✅ 3 Classes created`);

  // 4. Create 30 Students (10 per teacher)
  const students = [];
  for (let t = 0; t < 3; t++) {
    const teacher = teachers[t];
    const teacherClass = classes[t];

    for (let s = 1; s <= 10; s++) {
      const studentNum = (t * 10) + s;
      const student = await prisma.user.upsert({
        where: { email: `student${studentNum}@emaqra2a.com` },
        update: {
          studentProfile: {
            upsert: {
              create: {
                currentJuz: 30,
                currentSurah: 78,
                teacherId: teacher.id,
                classId: teacherClass.id,
              },
              update: {
                teacherId: teacher.id,
                classId: teacherClass.id,
              }
            }
          }
        },
        create: {
          email: `student${studentNum}@emaqra2a.com`,
          fullName: `طالب ${studentNum}`,
          passwordHash,
          role: Role.STUDENT,
          phone: `05000010${studentNum.toString().padStart(2, '0')}`,
          studentProfile: {
            create: {
              currentJuz: 30,
              currentSurah: 78,
              teacherId: teacher.id,
              classId: teacherClass.id,
            },
          },
        },
      });
      students.push(student);
    }
  }
  console.log(`✅ 30 Students created and assigned`);

  // 5. Create Live Sessions (1 per teacher)
  for (let i = 0; i < 3; i++) {
    const teacher = teachers[i];
    await prisma.liveSession.create({
      data: {
        title: `حلقة البث المباشر الأسبوعية - ${teacher.fullName}`,
        sessionType: SessionType.MEMORIZATION,
        teacherId: teacher.id,
        scheduledAt: new Date(Date.now() + 86400000 * (i + 1)), // Future date
        durationMinutes: 60,
        maxParticipants: 15,
        meetingUrl: 'https://meet.google.com/test-url',
      }
    });
  }
  console.log(`✅ Live Sessions created`);

  // 6. Create Exams (1 per teacher)
  for (let i = 0; i < 3; i++) {
    const teacher = teachers[i];
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
            },
            {
              questionType: QuestionType.SHORT_ANSWER,
              questionText: 'اذكر حكم النون الساكنة في كلمة (من يعمل)',
              correctAnswer: 'إدغام بغنة',
              points: 5,
              orderIndex: 2,
            }
          ]
        }
      }
    });
  }
  console.log(`✅ Exams created`);

  // 7. Create Tasks (Wird) - 2 per student (1 Assigned, 1 Completed)
  for (const student of students) {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: student.id } });
    if (!profile || !profile.teacherId) continue;

    // Assigned task
    await prisma.memorizationTask.create({
      data: {
        studentId: student.id,
        teacherId: profile.teacherId,
        taskType: TaskType.NEW,
        surahNumber: 78, // An-Naba
        ayahStart: 1,
        ayahEnd: 20,
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        status: 'ASSIGNED',
        notes: 'الرجاء التركيز على أحكام المد',
      }
    });

    // Completed task -> with submission and assessment
    const completedTask = await prisma.memorizationTask.create({
      data: {
        studentId: student.id,
        teacherId: profile.teacherId,
        taskType: TaskType.REVISION,
        surahNumber: 79, // An-Naziat
        ayahStart: 1,
        ayahEnd: 10,
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        status: 'COMPLETED',
      }
    });

    // Create Submission
    const submission = await prisma.memorizationSubmission.create({
      data: {
        taskId: completedTask.id,
        studentId: student.id,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Dummy
        status: 'REVIEWED',
        teacherNotes: 'تسميع جيد جداً',
      }
    });

    // Create Assessment
    await prisma.assessment.create({
      data: {
        submissionId: submission.id,
        memorizationScore: 9,
        tajweedScore: 8,
        fluencyScore: 9,
        overallScore: 9,
        feedback: 'بارك الله فيك، استمر',
      }
    });
  }
  console.log(`✅ Tasks, Submissions, and Assessments created`);

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
