import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/api-response';

async function getStudentDashboard(userId: string) {
  const [task, completedTasks, pendingTasks, examCount, notifications, upcomingExams, submissions] =
    await Promise.all([
      prisma.memorizationTask.findFirst({
        where: { studentId: userId, status: 'ASSIGNED' },
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          taskType: true,
          surahNumber: true,
          ayahStart: true,
          ayahEnd: true,
          dueDate: true,
          notes: true,
          teacher: { select: { fullName: true } },
        },
      }),
      prisma.memorizationTask.count({ where: { studentId: userId, status: 'COMPLETED' } }),
      prisma.memorizationTask.count({ where: { studentId: userId, status: 'ASSIGNED' } }),
      prisma.examSubmission.count({ where: { studentId: userId, status: 'COMPLETED' } }),
      prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, message: true, isRead: true, createdAt: true },
      }),
      prisma.exam.findMany({
        where: { 
          status: 'PUBLISHED', 
          startTime: { gte: new Date() },
          teacherId: (await prisma.studentProfile.findUnique({ where: { userId } }))?.teacherId || 'no-teacher'
        },
        orderBy: { startTime: 'asc' },
        take: 4,
        select: { id: true, title: true, examType: true, startTime: true, timeLimitMinutes: true },
      }),
      prisma.memorizationSubmission.findMany({
        where: { studentId: userId },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        select: { id: true, status: true, submittedAt: true, assessment: { select: { overallScore: true } } },
      }),
    ]);

  return {
    role: 'STUDENT',
    stats: {
      completedTasks,
      pendingTasks,
      completedExams: examCount,
      learningStreak: Math.min(completedTasks + 3, 30),
      progressPercent: Math.min(Math.round((completedTasks / Math.max(completedTasks + pendingTasks, 1)) * 100), 100),
    },
    dailyTask: task,
    notifications,
    upcomingExams,
    recentSubmissions: submissions,
  };
}

async function getTeacherDashboard(userId: string) {
  const [students, activeTasks, exams, pendingReviews, notifications] = await Promise.all([
    prisma.studentProfile.count({ where: { teacherId: userId } }),
    prisma.memorizationTask.count({ where: { teacherId: userId, status: 'ASSIGNED' } }),
    prisma.exam.count({ where: { teacherId: userId } }),
    prisma.memorizationSubmission.count({
      where: { status: 'PENDING', task: { teacherId: userId } },
    }),
    prisma.notification.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, message: true, createdAt: true },
    }),
  ]);

  return {
    role: 'TEACHER',
    stats: { students, activeTasks, exams, pendingReviews },
    notifications,
  };
}

async function getAdminDashboard() {
  const [users, teachers, students, exams, contentItems, notifications] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { role: 'TEACHER' } }),
    prisma.profile.count({ where: { role: 'STUDENT' } }),
    prisma.exam.count(),
    prisma.islamicContent.count(),
    prisma.notification.count(),
  ]);

  return {
    role: 'ADMIN',
    stats: { users, teachers, students, exams, contentItems, notifications },
  };
}

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const role = req.user!.role;
  try {
    const role = req.user!.role;
    const userId = req.user!.id;

    const dashboard =
      role === 'STUDENT'
        ? await getStudentDashboard(userId)
        : role === 'TEACHER'
          ? await getTeacherDashboard(userId)
          : await getAdminDashboard();

    sendSuccess(res, { dashboard }, 'Dashboard loaded successfully');
  } catch (error) {
    console.error('Dashboard Error:', error);
    sendError(res, 500, 'Failed to load dashboard');
  }
};

export const getNavbarStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;
    const userId = req.user!.id;
    let newTasks = 0;
    let newExams = 0;
    let pendingSubmissions = 0;

    if (role === 'STUDENT') {
      newTasks = await prisma.memorizationTask.count({ where: { studentId: userId, status: 'ASSIGNED' } });
      const profile = await prisma.studentProfile.findUnique({ where: { userId } });
      if (profile?.teacherId) {
        newExams = await prisma.exam.count({
          where: { teacherId: profile.teacherId, status: 'PUBLISHED', startTime: { gte: new Date() } }
        });
      }
    } else if (role === 'TEACHER') {
      pendingSubmissions = await prisma.memorizationSubmission.count({
        where: { status: 'PENDING', task: { teacherId: userId } }
      });
    }

    const [unreadMessages, unreadNotifications] = await Promise.all([
      prisma.message.count({ where: { recipientId: userId, isRead: false } }),
      prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
    ]);

    sendSuccess(res, { newTasks, newExams, pendingSubmissions, unreadMessages, unreadNotifications }, 'Navbar stats loaded');
  } catch (error) {
    sendError(res, 500, 'Failed to load navbar stats');
  }
};
