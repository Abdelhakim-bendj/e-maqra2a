import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import { writeAuditLog } from '../utils/audit';

const createExamSchema = z.object({
  title: z.string().trim().min(3, 'عنوان الاختبار مطلوب').max(200),
  description: z.string().max(1000).optional(),
  examType: z.enum(['WEEKLY', 'MONTHLY']),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  timeLimitMinutes: z.number().int().min(5).max(300),
  passingScore: z.number().int().min(0).max(100),
  questions: z.array(z.object({
    questionType: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
    questionText: z.string().min(5, 'نص السؤال مطلوب'),
    options: z.array(z.string()).min(2).max(6).optional(),
    correctAnswer: z.string().min(1),
    points: z.number().int().min(1).max(100),
    orderIndex: z.number().int().min(0),
  })).min(1, 'يجب إضافة سؤال واحد على الأقل'),
});

const submitExamSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    studentAnswer: z.string(),
  })),
});

const gradeShortAnswerSchema = z.object({
  answerId: z.string().uuid(),
  pointsAwarded: z.number().int().min(0),
  isCorrect: z.boolean(),
});

// GET /api/exams
export const listExams = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;
  const { status } = req.query as { status?: string };

  const where: Record<string, unknown> = {};
  if (role === 'TEACHER') {
    where.teacherId = userId;
  } else if (role === 'STUDENT') {
    where.status = 'PUBLISHED';
    const profile = await prisma.studentProfile.findUnique({ 
      where: { userId },
      include: { class: true }
    });
    const teacherIds = [];
    if (profile?.teacherId) teacherIds.push(profile.teacherId);
    if (profile?.class?.teacherId) teacherIds.push(profile.class.teacherId);
    
    if (teacherIds.length > 0) {
      where.teacherId = { in: teacherIds };
    } else {
      where.teacherId = 'no-teacher';
    }
  }

  if (status && role !== 'STUDENT') where.status = status;

  const exams = await prisma.exam.findMany({
    where,
    orderBy: { startTime: 'desc' },
    select: {
      id: true, title: true, examType: true, startTime: true, endTime: true,
      timeLimitMinutes: true, passingScore: true, status: true,
      teacher: { select: { id: true, fullName: true } },
      _count: { select: { questions: true, submissions: true } },
      submissions: role === 'STUDENT' ? {
        where: { studentId: userId },
        select: { id: true, totalScore: true, status: true }
      } : false,
      questions: { select: { points: true } },
    },
  });

  const formattedExams = exams.map(exam => {
    const maxScore = (exam.questions as { points: number }[] | undefined)?.reduce((acc, q) => acc + q.points, 0) || 0;
    const { questions, ...rest } = exam;
    return { ...rest, maxScore };
  });

  sendSuccess(res, { exams: formattedExams }, 'Exams loaded');
};

// GET /api/exams/:id
export const getExam = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;
  const exam = await prisma.exam.findUnique({
    where: { id: req.params.id },
    include: {
      teacher: { select: { id: true, fullName: true } },
      questions: { orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!exam) { sendError(res, 404, 'Exam not found'); return; }
  if (role === 'TEACHER' && exam.teacherId !== userId) { sendError(res, 403, 'Access denied'); return; }
  
  if (role === 'STUDENT') {
    const profile = await prisma.studentProfile.findUnique({ 
      where: { userId },
      include: { class: true }
    });
    const teacherIds = [];
    if (profile?.teacherId) teacherIds.push(profile.teacherId);
    if (profile?.class?.teacherId) teacherIds.push(profile.class.teacherId);
    
    if (!teacherIds.includes(exam.teacherId)) {
      sendError(res, 403, 'Access denied');
      return;
    }
  }
  if (role === 'STUDENT' && exam.status !== 'PUBLISHED') { sendError(res, 403, 'Exam not available'); return; }

  // Hide correct answers for students during active exam
  if (role === 'STUDENT') {
    const now = new Date();
    const isActive = now >= exam.startTime && now <= exam.endTime;
    if (isActive) {
      const sanitized = {
        ...exam,
        questions: exam.questions.map(({ correctAnswer: _ca, ...q }) => q),
      };
      sendSuccess(res, { exam: sanitized }, 'Exam loaded');
      return;
    }
  }

  sendSuccess(res, { exam }, 'Exam loaded');
};

// POST /api/exams — teacher creates exam with questions
export const createExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createExamSchema.parse(req.body);
    const teacherId = req.user!.id;

    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        examType: data.examType,
        teacherId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        timeLimitMinutes: data.timeLimitMinutes,
        passingScore: data.passingScore,
        status: 'PUBLISHED',
        questions: {
          create: data.questions.map((q) => ({
            questionType: q.questionType,
            questionText: q.questionText,
            options: q.options ? q.options : undefined,
            correctAnswer: q.correctAnswer,
            points: q.points,
            orderIndex: q.orderIndex,
          })),
        },
      },
      include: { questions: true },
    });

    await writeAuditLog(req, 'exam.create', { entity: 'Exam', entityId: exam.id });
    sendSuccess(res, { exam }, 'Exam created', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    console.error('Create exam error:', err);
    sendError(res, 500, 'Internal server error');
  }
};

// PUT /api/exams/:id
export const updateExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createExamSchema.partial().parse(req.body);
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) { sendError(res, 404, 'Exam not found'); return; }
    if (exam.teacherId !== req.user!.id && req.user!.role !== 'ADMIN') {
      sendError(res, 403, 'Access denied'); return;
    }
    const updated = await prisma.exam.update({
      where: { id: exam.id },
      data: {
        title: data.title,
        description: data.description,
        examType: data.examType,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        timeLimitMinutes: data.timeLimitMinutes,
        passingScore: data.passingScore,
        status: 'PUBLISHED',
      },
    });
    await writeAuditLog(req, 'exam.update', { entity: 'Exam', entityId: exam.id });
    sendSuccess(res, { exam: updated }, 'Exam updated');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

// PATCH /api/exams/:id/publish — teacher publishes exam
export const publishExam = async (req: AuthRequest, res: Response): Promise<void> => {
  const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
  if (!exam) { sendError(res, 404, 'Exam not found'); return; }
  if (exam.teacherId !== req.user!.id && req.user!.role !== 'ADMIN') {
    sendError(res, 403, 'Access denied'); return;
  }
  await prisma.exam.update({ where: { id: exam.id }, data: { status: 'PUBLISHED' } });
  sendSuccess(res, null, 'Exam published');
};

// POST /api/exams/:id/start — student starts exam
export const startExam = async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user!.id;
  const exam = await prisma.exam.findUnique({
    where: { id: req.params.id },
    include: { questions: { orderBy: { orderIndex: 'asc' } } },
  });

  if (!exam || exam.status !== 'PUBLISHED') { sendError(res, 404, 'Exam not available'); return; }

  const now = new Date();
  if (now < exam.startTime || now > exam.endTime) {
    sendError(res, 400, 'الاختبار غير متاح في الوقت الحالي'); return;
  }

  const existing = await prisma.examSubmission.findFirst({
    where: { examId: exam.id, studentId },
  });
  if (existing) { sendError(res, 409, 'لقد بدأت هذا الاختبار من قبل'); return; }

  const submission = await prisma.examSubmission.create({
    data: { examId: exam.id, studentId },
  });

  const questions = exam.questions.map(({ correctAnswer: _ca, ...q }) => q);
  sendSuccess(res, { submission, questions }, 'Exam started');
};

// POST /api/exams/:id/submit — student submits answers
export const submitExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { answers } = submitExamSchema.parse(req.body);

    const submission = await prisma.examSubmission.findFirst({
      where: { examId: req.params.id, studentId, status: 'IN_PROGRESS' },
      include: { exam: { include: { questions: true } } },
    });

    if (!submission) { sendError(res, 404, 'Exam submission not found'); return; }

    // Auto-grade MCQ and T/F
    let totalScore = 0;
    const answerData = answers.map((a) => {
      const question = submission.exam.questions.find((q) => q.id === a.questionId);
      if (!question) return null;

      const isAutoGraded = question.questionType !== 'SHORT_ANSWER';
      const isCorrect = isAutoGraded
        ? a.studentAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
        : null;
      const pointsAwarded = isAutoGraded && isCorrect ? question.points : null;

      if (isAutoGraded && isCorrect) totalScore += question.points;

      return {
        submissionId: submission.id,
        questionId: a.questionId,
        studentAnswer: a.studentAnswer,
        isCorrect,
        pointsAwarded,
      };
    }).filter(Boolean) as any[];

    await prisma.$transaction([
      prisma.answer.createMany({ data: answerData }),
      prisma.examSubmission.update({
        where: { id: submission.id },
        data: { submittedAt: new Date(), totalScore, status: 'COMPLETED' },
      }),
    ]);

    await writeAuditLog(req, 'exam.submit', { entity: 'ExamSubmission', entityId: submission.id });
    sendSuccess(res, { score: totalScore, maxScore: submission.exam.passingScore }, 'Exam submitted');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    console.error('Submit exam error:', err);
    sendError(res, 500, 'Internal server error');
  }
};

// GET /api/exams/:id/results — student sees their result; teacher sees all
export const getExamResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;

  const where: Record<string, unknown> = { examId: req.params.id };
  if (role === 'STUDENT') where.studentId = userId;

  const submissions = await prisma.examSubmission.findMany({
    where,
    include: {
      student: { select: { id: true, fullName: true } },
      answers: {
        include: { question: { select: { questionText: true, points: true, questionType: true } } },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  sendSuccess(res, { submissions }, 'Results loaded');
};

// PATCH /api/exams/grade — teacher grades short answers
export const gradeShortAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = gradeShortAnswerSchema.parse(req.body);
    await prisma.answer.update({
      where: { id: data.answerId },
      data: { isCorrect: data.isCorrect, pointsAwarded: data.pointsAwarded },
    });
    sendSuccess(res, null, 'Answer graded');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};
