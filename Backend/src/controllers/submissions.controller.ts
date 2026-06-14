import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import { writeAuditLog } from '../utils/audit';

const createSubmissionSchema = z.object({
  taskId: z.string().uuid('معرف المهمة غير صالح').optional(),
  audioUrl: z.string().min(1, 'رابط الصوت أو بيانات الصوت مطلوبة'),
  notes: z.string().max(500).optional(),
});

const createAssessmentSchema = z.object({
  submissionId: z.string().uuid(),
  memorizationScore: z.number().int().min(1).max(10),
  tajweedScore: z.number().int().min(1).max(10),
  fluencyScore: z.number().int().min(1).max(10),
  feedback: z.string().max(1000).optional(),
});

// GET /api/submissions — teacher sees pending; student sees own
export const listSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;
  const { status, studentId } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};

  if (role === 'STUDENT') {
    where.studentId = userId;
  } else if (role === 'TEACHER') {
    where.task = { teacherId: userId };
    if (studentId) where.studentId = studentId;
  }

  if (status && ['PENDING', 'REVIEWED', 'REVISION_NEEDED'].includes(status)) {
    where.status = status;
  }

  const submissions = await prisma.memorizationSubmission.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    take: 50,
    include: {
      student: { select: { id: true, fullName: true, avatarUrl: true } },
      task: { select: { surahNumber: true, ayahStart: true, ayahEnd: true, taskType: true, notes: true } },
      assessment: true,
    },
  });

  sendSuccess(res, { submissions }, 'Submissions loaded');
};

// GET /api/submissions/:id
export const getSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;
  const submission = await prisma.memorizationSubmission.findUnique({
    where: { id: req.params.id },
    include: {
      student: { select: { id: true, fullName: true } },
      task: { include: { teacher: { select: { id: true, fullName: true } } } },
      assessment: true,
    },
  });

  if (!submission) { sendError(res, 404, 'Submission not found'); return; }
  if (role === 'STUDENT' && submission.studentId !== userId) { sendError(res, 403, 'Access denied'); return; }
  if (role === 'TEACHER' && submission.task?.teacherId !== userId) { sendError(res, 403, 'Access denied'); return; }

  sendSuccess(res, { submission }, 'Submission loaded');
};

// POST /api/submissions — student submits audio
export const createSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, audioUrl, notes } = createSubmissionSchema.parse(req.body);
    const studentId = req.user!.id;

    let targetTaskId = taskId;
    let targetTeacherId = '';
    let messageBody = '';

    if (targetTaskId) {
      const task = await prisma.memorizationTask.findUnique({ where: { id: targetTaskId } });
      if (!task || task.studentId !== studentId) { sendError(res, 404, 'Task not found'); return; }
      targetTeacherId = task.teacherId;
      messageBody = `قدّم الطالب تسميعاً لسورة ${task.surahNumber}، الآيات ${task.ayahStart}–${task.ayahEnd}. ${notes ? `ملاحظات: ${notes}` : ''}`;
      
      await prisma.memorizationTask.update({
        where: { id: targetTaskId },
        data: { status: 'COMPLETED' },
      });
    } else {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
      if (!profile || !profile.teacherId) {
        sendError(res, 400, 'لا يوجد معلم معين لإنشاء تسميع حر');
        return;
      }
      targetTeacherId = profile.teacherId;

      const newTask = await prisma.memorizationTask.create({
        data: {
          studentId,
          teacherId: targetTeacherId,
          taskType: 'REVISION',
          surahNumber: 1,
          ayahStart: 1,
          ayahEnd: 1,
          dueDate: new Date(),
          status: 'COMPLETED',
          notes: 'تسميع حر - غير مرتبط بمهمة',
        }
      });
      targetTaskId = newTask.id;
      messageBody = `قدّم الطالب تسميعاً حراً. ${notes ? `ملاحظات: ${notes}` : ''}`;
    }

    const submission = await prisma.memorizationSubmission.create({
      data: { taskId: targetTaskId, studentId, audioUrl, status: 'PENDING', teacherNotes: notes },
    });

    // Notify teacher
    await prisma.notification.create({
      data: {
        senderId: studentId,
        recipientId: targetTeacherId,
        type: 'AUTO',
        title: taskId ? 'تسميع جديد للمراجعة' : 'تسميع حر جديد',
        message: messageBody,
      },
    });

    await writeAuditLog(req, 'submission.create', { entity: 'MemorizationSubmission', entityId: submission.id });
    sendSuccess(res, { submission }, 'Submission created', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

// POST /api/submissions/assess — teacher submits assessment
export const createAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createAssessmentSchema.parse(req.body);
    const teacherId = req.user!.id;

    const submission = await prisma.memorizationSubmission.findUnique({
      where: { id: data.submissionId },
      include: { task: true, assessment: true },
    });

    if (!submission) { sendError(res, 404, 'Submission not found'); return; }
    if (submission.task.teacherId !== teacherId) { sendError(res, 403, 'Access denied'); return; }
    if (submission.assessment) { sendError(res, 409, 'Submission already assessed'); return; }

    const overallScore = Math.round((data.memorizationScore + data.tajweedScore + data.fluencyScore) / 3);
    const status = overallScore >= 6 ? 'REVIEWED' : 'REVISION_NEEDED';

    const [assessment] = await prisma.$transaction([
      prisma.assessment.create({
        data: {
          submissionId: data.submissionId,
          memorizationScore: data.memorizationScore,
          tajweedScore: data.tajweedScore,
          fluencyScore: data.fluencyScore,
          overallScore,
          feedback: data.feedback,
        },
      }),
      prisma.memorizationSubmission.update({
        where: { id: data.submissionId },
        data: { status },
      }),
    ]);

    // Notify student
    await prisma.notification.create({
      data: {
        senderId: teacherId,
        recipientId: submission.studentId,
        type: 'PRIVATE',
        title: 'تم تقييم تسميعك',
        message: `حصلت على ${overallScore}/10 في تسميعك. ${data.feedback ?? ''}`,
      },
    });

    await writeAuditLog(req, 'assessment.create', { entity: 'Assessment', entityId: assessment.id });
    sendSuccess(res, { assessment }, 'Assessment submitted', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};
