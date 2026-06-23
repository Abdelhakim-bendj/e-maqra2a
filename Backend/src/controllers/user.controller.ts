import bcrypt from 'bcrypt';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import { writeAuditLog } from '../utils/audit';

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  fullName: z.string().trim().min(2).max(100),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  studentProfile: {
    select: {
      currentJuz: true,
      currentSurah: true,
      teacherId: true,
      teacherStatus: true,
      classId: true,
      class: { select: { name: true } },
    },
  },
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  let whereClause: any = {};
  
  if (req.user?.role === 'TEACHER') {
    // Find all student profiles supervised by this teacher directly or via class
    const profiles = await prisma.studentProfile.findMany({
      where: {
        OR: [
          { teacherId: req.user.id },
          { class: { teacherId: req.user.id } }
        ]
      },
      select: { userId: true }
    });
    const studentUserIds = profiles.map(p => p.userId);

    whereClause = {
      OR: [
        { id: { in: studentUserIds }, role: 'STUDENT' },
        { role: 'ADMIN' }
      ]
    };
  } else if (req.user?.role === 'STUDENT') {
    // We need to find the student's classId and teacherId first
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id },
      select: { classId: true, teacherId: true }
    });
    
    // Students see their teacher, students in same class, admins, and all teachers (so they can select one)
    const orConditions: any[] = [{ role: 'ADMIN' }, { role: 'TEACHER' }];
    
    if (profile?.classId) {
      orConditions.push({ role: 'STUDENT', studentProfile: { is: { classId: profile.classId } } });
    }

    whereClause = { OR: orConditions };
  }

  console.log(`[DEBUG listUsers] user role: ${req.user?.role}, id: ${req.user?.id}`);
  console.log(`[DEBUG listUsers] whereClause:`, JSON.stringify(whereClause, null, 2));

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: publicUserSelect,
  });

  console.log(`[DEBUG listUsers] fetched ${users.length} users. Students: ${users.filter(u => u.role === 'STUDENT').length}`);

  sendSuccess(res, { users }, 'Users loaded');
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createUserSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      sendError(res, 409, 'A user with this email already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          fullName: data.fullName,
          passwordHash,
          role: data.role,
        },
        select: publicUserSelect,
      });

      if (data.role === 'STUDENT') {
        await tx.studentProfile.create({ data: { userId: createdUser.id } });
      }

      return createdUser;
    });

    await writeAuditLog(req, 'users.create', {
      userId: req.user?.id,
      entity: 'User',
      entityId: user.id,
      metadata: { role: user.role },
    });

    sendSuccess(res, { user }, 'User created successfully', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(error));
      return;
    }
    throw error;
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: publicUserSelect,
    });

    await writeAuditLog(req, 'users.update', {
      userId: req.user?.id,
      entity: 'User',
      entityId: user.id,
      metadata: data,
    });

    sendSuccess(res, { user }, 'User updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(error));
      return;
    }
    throw error;
  }
};

export const selectTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacherId } = z.object({ teacherId: z.string().uuid() }).parse(req.body);
    const userId = req.user!.id;

    if (req.user!.role !== 'STUDENT') {
      sendError(res, 403, 'Only students can select a teacher'); return;
    }

    const teacher = await prisma.user.findUnique({ where: { id: teacherId, role: 'TEACHER' } });
    if (!teacher) {
      sendError(res, 404, 'Teacher not found'); return;
    }

    const profile = await prisma.studentProfile.update({
      where: { userId },
      data: { teacherId, teacherStatus: 'PENDING' },
    });

    await prisma.notification.create({
      data: {
        title: 'طلب انضمام جديد',
        message: `يرغب الطالب ${req.user!.fullName} في الانضمام إلى مجموعتك.`,
        type: 'AUTO',
        recipientId: teacherId,
        senderId: userId,
      }
    });

    sendSuccess(res, { profile }, 'Teacher selected, waiting for approval');
  } catch (error) {
    if (error instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(error)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

export const acceptStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, status } = z.object({ 
      studentId: z.string().uuid(),
      status: z.enum(['ACCEPTED', 'REJECTED'])
    }).parse(req.body);

    if (req.user!.role !== 'TEACHER') {
      sendError(res, 403, 'Only teachers can accept students'); return;
    }

    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    if (!profile || profile.teacherId !== req.user!.id) {
      sendError(res, 403, 'Student not assigned to you'); return;
    }

    const updated = await prisma.studentProfile.update({
      where: { userId: studentId },
      data: { teacherStatus: status },
    });

    await prisma.notification.create({
      data: {
        title: status === 'ACCEPTED' ? 'تم قبول طلب الانضمام' : 'تم رفض طلب الانضمام',
        message: status === 'ACCEPTED' ? `لقد تم قبولك في مجموعة المعلم ${req.user!.fullName}.` : `نعتذر، لم يتم قبول طلب انضمامك لمجموعة المعلم ${req.user!.fullName}.`,
        type: 'AUTO',
        recipientId: studentId,
        senderId: req.user!.id,
      }
    });

    sendSuccess(res, { profile: updated }, `Student ${status.toLowerCase()}`);
  } catch (error) {
    if (error instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(error)); return; }
    sendError(res, 500, 'Internal server error');
  }
};
