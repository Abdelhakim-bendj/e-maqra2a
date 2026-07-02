import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest, invalidateRoleCache } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import { writeAuditLog } from '../utils/audit';

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
});

const userPublicSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  phone: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
  studentProfile: {
    select: {
      teacherId: true,
      teacherStatus: true,
      classId: true,
      currentJuz: true,
      currentSurah: true,
    },
  },
};

const deprecatedMsg = 'This endpoint is deprecated. The platform now uses Supabase Auth. Please use the Supabase client on the frontend for authentication.';

export const register = async (req: Request, res: Response): Promise<void> => {
  sendError(res, 400, deprecatedMsg);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  sendError(res, 400, deprecatedMsg);
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  sendError(res, 400, deprecatedMsg);
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  sendError(res, 400, deprecatedMsg);
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  sendError(res, 400, deprecatedMsg);
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  sendError(res, 400, deprecatedMsg);
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  sendError(res, 400, deprecatedMsg);
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        ...userPublicSelect,
        studentProfile: {
          select: {
            teacherId: true,
            teacherStatus: true,
            classId: true,
            currentJuz: true,
            currentSurah: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      sendError(res, 404, 'Profile not found');
      return;
    }

    sendSuccess(res, { user }, 'Profile loaded');
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.profile.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
      },
      select: userPublicSelect,
    });

    invalidateRoleCache(userId);
    await writeAuditLog(req, 'auth.update_profile', { userId, entity: 'Profile', entityId: userId });

    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(error));
      return;
    }
    console.error('Update profile error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

export const syncProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email || '';
    const { fullName, role } = req.body;

    const existingUser = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (existingUser) {
      sendSuccess(res, { synced: true }, 'Profile already exists');
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.profile.create({
        data: {
          id: userId,
          email,
          fullName: fullName || 'User',
          role: role || 'STUDENT',
        }
      });
      if (role === 'STUDENT' || !role) {
        await tx.studentProfile.create({
          data: { userId }
        });
      }
    });

    sendSuccess(res, { synced: true }, 'Profile created successfully');
  } catch (error) {
    console.error('Sync profile error:', error);
    sendError(res, 500, 'Internal server error');
  }
};
