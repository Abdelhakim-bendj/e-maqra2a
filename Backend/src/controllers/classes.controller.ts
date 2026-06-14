import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import { writeAuditLog } from '../utils/audit';

const createClassSchema = z.object({
  name: z.string().trim().min(2, 'اسم الفصل مطلوب').max(100),
  description: z.string().max(500).optional(),
  teacherId: z.string().uuid().optional(),
});

const assignStudentSchema = z.object({
  studentId: z.string().uuid('معرف الطالب غير صالح'),
});

// GET /api/classes
export const listClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;

  const where =
    role === 'TEACHER'
      ? { teacherId: userId }
      : role === 'STUDENT'
        ? { students: { some: { userId } } }
        : {}; // ADMIN sees all

  const classes = await prisma.class.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      teacher: { select: { id: true, fullName: true } },
      _count: { select: { students: true } },
    },
  });

  sendSuccess(res, { classes }, 'Classes loaded');
};

// GET /api/classes/:id
export const getClass = async (req: AuthRequest, res: Response): Promise<void> => {
  const cls = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: {
      teacher: { select: { id: true, fullName: true } },
      students: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  if (!cls) { sendError(res, 404, 'Class not found'); return; }
  sendSuccess(res, { class: cls }, 'Class loaded');
};

// POST /api/classes
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createClassSchema.parse(req.body);
    const cls = await prisma.class.create({
      data: {
        name: data.name,
        description: data.description,
        teacherId: data.teacherId ?? null,
        createdBy: req.user!.id,
      },
      include: { teacher: { select: { id: true, fullName: true } } },
    });

    await writeAuditLog(req, 'class.create', { entity: 'Class', entityId: cls.id });
    sendSuccess(res, { class: cls }, 'Class created', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    console.error('Create class error:', err);
    sendError(res, 500, 'Internal server error');
  }
};

// PUT /api/classes/:id
export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createClassSchema.partial().parse(req.body);
    const cls = await prisma.class.update({
      where: { id: req.params.id },
      data,
      include: { teacher: { select: { id: true, fullName: true } } },
    });
    await writeAuditLog(req, 'class.update', { entity: 'Class', entityId: cls.id });
    sendSuccess(res, { class: cls }, 'Class updated');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

// DELETE /api/classes/:id
export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.class.delete({ where: { id: req.params.id } });
  await writeAuditLog(req, 'class.delete', { entity: 'Class', entityId: req.params.id });
  sendSuccess(res, null, 'Class deleted');
};

// POST /api/classes/:id/students — assign a student to class
export const assignStudentToClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = assignStudentSchema.parse(req.body);
    const classId = req.params.id;

    await prisma.studentProfile.update({
      where: { userId: studentId },
      data: { classId },
    });

    await writeAuditLog(req, 'class.assign_student', { entity: 'Class', entityId: classId, metadata: { studentId } });
    sendSuccess(res, null, 'Student assigned to class');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

// DELETE /api/classes/:id/students/:studentId — remove student from class
export const removeStudentFromClass = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.studentProfile.update({
    where: { userId: req.params.studentId },
    data: { classId: null },
  });
  sendSuccess(res, null, 'Student removed from class');
};
