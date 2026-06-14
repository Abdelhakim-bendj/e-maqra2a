import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess } from '../utils/api-response';

// GET /api/reports/student/:studentId — teacher/admin gets full student report
export const getStudentReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.params;
  const { role, id: userId } = req.user!;

  const student = await prisma.user.findUnique({
    where: { id: studentId, role: 'STUDENT' },
    select: { id: true, fullName: true, createdAt: true },
  });
  if (!student) { sendError(res, 404, 'Student not found'); return; }

  const [tasks, submissions, examResults, profile] = await Promise.all([
    prisma.memorizationTask.findMany({
      where: { studentId },
      orderBy: { assignedDate: 'desc' },
      select: { id: true, surahNumber: true, ayahStart: true, ayahEnd: true, status: true, dueDate: true, taskType: true },
    }),
    prisma.memorizationSubmission.findMany({
      where: { studentId },
      orderBy: { submittedAt: 'desc' },
      include: { assessment: true, task: { select: { surahNumber: true, ayahStart: true, ayahEnd: true } } },
    }),
    prisma.examSubmission.findMany({
      where: { studentId, status: 'COMPLETED' },
      orderBy: { submittedAt: 'desc' },
      include: { exam: { select: { title: true, examType: true, passingScore: true } } },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: { currentJuz: true, currentSurah: true, enrollmentDate: true, class: { select: { name: true } } },
    }),
  ]);

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const assessedSubmissions = submissions.filter((s) => s.assessment);
  const avgScore = assessedSubmissions.length > 0
    ? Math.round(assessedSubmissions.reduce((sum, s) => sum + (s.assessment?.overallScore ?? 0), 0) / assessedSubmissions.length)
    : null;

  const passedExams = examResults.filter((e) => (e.totalScore ?? 0) >= e.exam.passingScore);

  sendSuccess(res, {
    student,
    profile,
    summary: {
      totalTasks: tasks.length,
      completedTasks,
      completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      totalSubmissions: submissions.length,
      avgAssessmentScore: avgScore,
      totalExams: examResults.length,
      passedExams: passedExams.length,
      examPassRate: examResults.length > 0 ? Math.round((passedExams.length / examResults.length) * 100) : 0,
    },
    tasks,
    submissions,
    examResults,
  }, 'Student report loaded');
};

// GET /api/reports/class/:classId — class aggregate performance
export const getClassReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { classId } = req.params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: { select: { fullName: true } },
      students: {
        include: {
          user: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!cls) { sendError(res, 404, 'Class not found'); return; }

  const studentIds = cls.students.map((s) => s.userId);

  const [taskCounts, submissionStats, examStats] = await Promise.all([
    prisma.memorizationTask.groupBy({
      by: ['studentId', 'status'],
      where: { studentId: { in: studentIds } },
      _count: true,
    }),
    prisma.assessment.aggregate({
      where: { submission: { studentId: { in: studentIds } } },
      _avg: { overallScore: true, memorizationScore: true, tajweedScore: true, fluencyScore: true },
    }),
    prisma.examSubmission.aggregate({
      where: { studentId: { in: studentIds }, status: 'COMPLETED' },
      _avg: { totalScore: true },
      _count: true,
    }),
  ]);

  sendSuccess(res, {
    class: { id: cls.id, name: cls.name, teacher: cls.teacher, studentCount: cls.students.length },
    taskCounts,
    assessmentAverages: submissionStats._avg,
    examStats: { count: examStats._count, avgScore: examStats._avg.totalScore },
  }, 'Class report loaded');
};

// GET /api/reports/admin — platform-wide stats
export const getAdminReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalUsers, totalStudents, totalTeachers, totalClasses,
    totalTasks, completedTasks, totalExams, totalSessions,
    totalSubmissions, avgAssessmentScore,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
    prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
    prisma.class.count(),
    prisma.memorizationTask.count(),
    prisma.memorizationTask.count({ where: { status: 'COMPLETED' } }),
    prisma.exam.count(),
    prisma.liveSession.count(),
    prisma.memorizationSubmission.count(),
    prisma.assessment.aggregate({ _avg: { overallScore: true } }),
  ]);

  sendSuccess(res, {
    users: { total: totalUsers, students: totalStudents, teachers: totalTeachers },
    content: { classes: totalClasses, tasks: totalTasks, completedTasks, exams: totalExams, sessions: totalSessions },
    submissions: { total: totalSubmissions, avgScore: avgAssessmentScore._avg.overallScore },
    taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  }, 'Admin report loaded');
};
