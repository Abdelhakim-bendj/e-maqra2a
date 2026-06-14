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
      classId: true,
      class: { select: { name: true } },
    },
  },
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  let whereClause: any = {};
  
  if (req.user?.role === 'TEACHER') {
    // Find all student profiles supervised by this teacher
    const profiles = await prisma.studentProfile.findMany({
      where: { teacherId: req.user.id },
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
    
    // Students see their teacher, students in same class, and admins
    const orConditions: any[] = [{ role: 'ADMIN' }];
    
    if (profile?.teacherId) {
      orConditions.push({ id: profile.teacherId });
    }
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
