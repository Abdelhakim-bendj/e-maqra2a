import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import { writeAuditLog } from '../utils/audit';

const baseTaskSchema = z.object({
  studentId: z.string().uuid('معرف الطالب غير صالح'),
  taskType: z.enum(['NEW', 'REVISION']),
  surahNumber: z.number().int().min(1).max(114),
  ayahStart: z.number().int().min(1),
  ayahEnd: z.number().int().min(1),
  dueDate: z.coerce.date({ invalid_type_error: 'تاريخ الاستحقاق غير صالح' }),
  notes: z.string().max(500).optional(),
});

const createTaskSchema = baseTaskSchema.refine((d) => d.ayahEnd >= d.ayahStart, {
  message: 'آية النهاية يجب أن تكون بعد أو مساوية لآية البداية',
  path: ['ayahEnd'],
});

const bulkCreateTaskSchema = z.object({
  classId: z.string().uuid('معرف الفصل غير صالح'),
  taskType: z.enum(['NEW', 'REVISION']),
  surahNumber: z.number().int().min(1).max(114),
  ayahStart: z.number().int().min(1),
  ayahEnd: z.number().int().min(1),
  dueDate: z.coerce.date({ invalid_type_error: 'تاريخ الاستحقاق غير صالح' }),
  notes: z.string().max(500).optional(),
}).refine((d) => d.ayahEnd >= d.ayahStart, {
  message: 'آية النهاية يجب أن تكون بعد أو مساوية لآية البداية',
  path: ['ayahEnd'],
});

const updateStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'COMPLETED', 'OVERDUE']),
});

// GET /api/tasks — student gets their own tasks; teacher gets tasks they assigned
export const listTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;
  const { status, studentId, page = '1', limit = '20' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const take = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * take;

  const where: Record<string, unknown> = {};

  if (role === 'STUDENT') {
    where.studentId = userId;
  } else if (role === 'TEACHER') {
    where.teacherId = userId;
    if (studentId) where.studentId = studentId;
  }
  // ADMIN sees all

  if (status && ['ASSIGNED', 'COMPLETED', 'OVERDUE'].includes(status as string)) {
    where.status = status;
  }

  const [tasks, total] = await Promise.all([
    prisma.memorizationTask.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      skip,
      take,
      select: {
        id: true,
        taskType: true,
        surahNumber: true,
        ayahStart: true,
        ayahEnd: true,
        assignedDate: true,
        dueDate: true,
        status: true,
        notes: true,
        teacher: { select: { id: true, fullName: true } },
        student: { select: { id: true, fullName: true } },
        submissions: {
          select: { id: true, status: true, submittedAt: true },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.memorizationTask.count({ where }),
  ]);

  sendSuccess(res, { tasks, total, page: pageNum, limit: take }, 'Tasks loaded');
};

// GET /api/tasks/:id
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: taskId } = req.params;
  const { role, id: userId } = req.user!;

  const task = await prisma.memorizationTask.findUnique({
    where: { id: taskId },
    include: {
      teacher: { select: { id: true, fullName: true } },
      student: { select: { id: true, fullName: true } },
      submissions: {
        orderBy: { submittedAt: 'desc' },
        include: { assessment: true },
      },
    },
  });

  if (!task) { sendError(res, 404, 'Task not found'); return; }

  if (role === 'STUDENT' && task.studentId !== userId) {
    sendError(res, 403, 'Access denied'); return;
  }
  if (role === 'TEACHER' && task.teacherId !== userId) {
    sendError(res, 403, 'Access denied'); return;
  }

  sendSuccess(res, { task }, 'Task loaded');
};

// GET /api/tasks/:id/students — teacher sees all students for this task and their status
export const getTaskStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: taskId } = req.params;
  const { role, id: userId } = req.user!;

  const task = await prisma.memorizationTask.findUnique({
    where: { id: taskId },
    select: { id: true, teacherId: true, surahNumber: true, ayahStart: true, ayahEnd: true, taskType: true, dueDate: true },
  });

  if (!task) { sendError(res, 404, 'Task not found'); return; }
  if (role === 'TEACHER' && task.teacherId !== userId) { sendError(res, 403, 'Access denied'); return; }

  // Find all tasks by same teacher with same surah/ayah range (i.e. bulk-assigned tasks)
  const relatedTasks = await prisma.memorizationTask.findMany({
    where: {
      teacherId: task.teacherId,
      surahNumber: task.surahNumber,
      ayahStart: task.ayahStart,
      ayahEnd: task.ayahEnd,
      taskType: task.taskType,
      dueDate: task.dueDate,
    },
    select: {
      id: true,
      status: true,
      student: { select: { id: true, fullName: true, avatarUrl: true } },
      submissions: {
        select: { id: true, status: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
    },
  });

  sendSuccess(res, { students: relatedTasks }, 'Task students loaded');
};

// POST /api/tasks — teacher creates task for one student
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createTaskSchema.parse(req.body);
    const teacherId = req.user!.id;

    // Verify student belongs to teacher
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: data.studentId },
    });
    if (!studentProfile || studentProfile.teacherId !== teacherId) {
      sendError(res, 403, 'لا يمكنك تعيين مهام لطلاب لا تشرف عليهم');
      return;
    }

    const task = await prisma.memorizationTask.create({
      data: {
        teacherId,
        studentId: data.studentId,
        taskType: data.taskType,
        surahNumber: data.surahNumber,
        ayahStart: data.ayahStart,
        ayahEnd: data.ayahEnd,
        dueDate: new Date(data.dueDate),
        notes: data.notes,
      },
      include: {
        student: { select: { id: true, fullName: true } },
      },
    });

    // Auto-create notification for student
    await prisma.notification.create({
      data: {
        senderId: teacherId,
        recipientId: data.studentId,
        type: 'AUTO',
        title: 'مهمة جديدة',
        message: `تم تعيين مهمة جديدة لك: سورة ${data.surahNumber}، الآيات ${data.ayahStart}–${data.ayahEnd}`,
      },
    });

    await writeAuditLog(req, 'task.create', { entity: 'MemorizationTask', entityId: task.id });
    sendSuccess(res, { task }, 'Task created successfully', 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('Task validation failed:', zodToFieldErrors(err));
      sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return;
    }
    console.error('Create task error:', err);
    sendError(res, 500, 'Internal server error');
  }
};

// POST /api/tasks/bulk — teacher assigns same task to whole class
export const createBulkTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = bulkCreateTaskSchema.parse(req.body);
    const teacherId = req.user!.id;

    const classStudents = await prisma.studentProfile.findMany({
      where: { classId: data.classId, class: { teacherId } },
      select: { userId: true },
    });

    if (classStudents.length === 0) {
      sendError(res, 404, 'No students found in this class'); return;
    }

    const tasks = await prisma.$transaction(
      classStudents.map((s) =>
        prisma.memorizationTask.create({
          data: {
            teacherId,
            studentId: s.userId,
            taskType: data.taskType,
            surahNumber: data.surahNumber,
            ayahStart: data.ayahStart,
            ayahEnd: data.ayahEnd,
            dueDate: new Date(data.dueDate),
            notes: data.notes,
          },
        })
      )
    );

    // Bulk notifications
    await prisma.notification.createMany({
      data: classStudents.map((s) => ({
        senderId: teacherId,
        recipientId: s.userId,
        type: 'AUTO' as const,
        title: 'مهمة جديدة للفصل',
        message: `تم تعيين مهمة جديدة: سورة ${data.surahNumber}، الآيات ${data.ayahStart}–${data.ayahEnd}`,
      })),
    });

    await writeAuditLog(req, 'task.bulk_create', { entity: 'MemorizationTask', metadata: { count: tasks.length } });
    sendSuccess(res, { count: tasks.length }, `${tasks.length} tasks created`, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('Bulk task validation failed:', zodToFieldErrors(err));
      sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return;
    }
    console.error('Bulk task error:', err);
    sendError(res, 500, 'Internal server error');
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = baseTaskSchema.partial().parse(req.body);
    const task = await prisma.memorizationTask.findUnique({ where: { id: req.params.id } });
    if (!task) { sendError(res, 404, 'Task not found'); return; }
    if (task.teacherId !== req.user!.id && req.user!.role !== 'ADMIN') {
      sendError(res, 403, 'Access denied'); return;
    }
    const updated = await prisma.memorizationTask.update({
      where: { id: task.id },
      data: {
        taskType: data.taskType,
        surahNumber: data.surahNumber,
        ayahStart: data.ayahStart,
        ayahEnd: data.ayahEnd,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
      },
    });
    sendSuccess(res, { task: updated }, 'Task updated');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

// PATCH /api/tasks/:id/status — student marks complete; teacher can update any status
export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: taskId } = req.params;
    const { role, id: userId } = req.user!;
    const { status } = updateStatusSchema.parse(req.body);

    const task = await prisma.memorizationTask.findUnique({ where: { id: taskId } });
    if (!task) { sendError(res, 404, 'Task not found'); return; }

    if (role === 'STUDENT') {
      if (task.studentId !== userId) { sendError(res, 403, 'Access denied'); return; }
      if (status !== 'COMPLETED') { sendError(res, 400, 'Students can only mark tasks as completed'); return; }
    } else if (role === 'TEACHER' && task.teacherId !== userId) {
      sendError(res, 403, 'Access denied'); return;
    }

    const updated = await prisma.memorizationTask.update({
      where: { id: taskId },
      data: { status },
      select: { id: true, status: true },
    });

    await writeAuditLog(req, 'task.update_status', { entity: 'MemorizationTask', entityId: taskId, metadata: { status } });
    sendSuccess(res, { task: updated }, 'Task status updated');
  } catch (err) {
    if (err instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return;
    }
    console.error('Update task status error:', err);
    sendError(res, 500, 'Internal server error');
  }
};

// DELETE /api/tasks/:id — teacher/admin only
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: taskId } = req.params;
  const { role, id: userId } = req.user!;

  const task = await prisma.memorizationTask.findUnique({ where: { id: taskId } });
  if (!task) { sendError(res, 404, 'Task not found'); return; }
  if (role === 'TEACHER' && task.teacherId !== userId) {
    sendError(res, 403, 'Access denied'); return;
  }

  await prisma.memorizationTask.delete({ where: { id: taskId } });
  await writeAuditLog(req, 'task.delete', { entity: 'MemorizationTask', entityId: taskId });
  sendSuccess(res, null, 'Task deleted');
};
