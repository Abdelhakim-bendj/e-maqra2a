import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest, invalidateRoleCache } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import {
  createOpaqueToken,
  hashToken,
  passwordResetExpiry,
  refreshTokenExpiry,
  signAccessToken,
} from '../utils/security';
import { writeAuditLog } from '../utils/audit';

const PASSWORD_COST = 12;
const db = prisma as typeof prisma & {
  refreshToken: {
    create: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<any>;
    update: (args: unknown) => Promise<unknown>;
    updateMany: (args: unknown) => Promise<unknown>;
  };
  passwordResetToken: {
    create: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<any>;
    update: (args: unknown) => Promise<unknown>;
  };
};

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  fullName: z.string().trim().min(2, 'الاسم الكامل مطلوب').max(100),
  phone: z.string().trim().min(5, 'رقم الهاتف مطلوب').max(20),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صالح'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(20, 'رمز إعادة التعيين غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

const userPublicSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  phone: true,
  avatarUrl: true,
  createdAt: true,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

async function issueSession(
  req: Request,
  res: Response,
  user: { id: string; email: string; role: Role }
): Promise<void> {
  const refreshToken = createOpaqueToken();
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  await db.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
      createdByIp: req.ip,
    },
  });

  setAuthCookies(res, accessToken, refreshToken);
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      sendError(res, 409, 'A user with this email already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, PASSWORD_COST);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
        },
        select: userPublicSelect,
      });

      if (data.role === 'STUDENT') {
        await tx.studentProfile.create({
          data: { userId: createdUser.id },
        });
      }

      return createdUser;
    });

    await issueSession(req, res, user);
    await writeAuditLog(req, 'auth.register', { userId: user.id, entity: 'User', entityId: user.id });

    sendSuccess(res, { user }, 'User registered successfully', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(error));
      return;
    }
    console.error('Register error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { ...userPublicSelect, passwordHash: true, isActive: true },
    });

    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches || !user.isActive) {
      sendError(res, 401, 'Invalid email or password');
      return;
    }

    await issueSession(req, res, user);
    await writeAuditLog(req, 'auth.login', { userId: user.id, entity: 'User', entityId: user.id });

    const { passwordHash: _passwordHash, isActive: _isActive, ...publicUser } = user;
    sendSuccess(res, { user: publicUser }, 'Login successful');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(error));
      return;
    }
    console.error('Login error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      clearAuthCookies(res);
      sendError(res, 401, 'Refresh token required');
      return;
    }

    const existingToken = await db.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (
      !existingToken ||
      existingToken.revokedAt ||
      existingToken.expiresAt <= new Date() ||
      !existingToken.user.isActive
    ) {
      clearAuthCookies(res);
      sendError(res, 401, 'Invalid or expired refresh token');
      return;
    }

    await db.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });
    await issueSession(req, res, existingToken.user);

    sendSuccess(res, null, 'Token refreshed successfully');
  } catch (error) {
    console.error('Refresh token error:', error);
    clearAuthCookies(res);
    sendError(res, 500, 'Internal server error');
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      await db.refreshToken.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (req.user?.id) {
      await writeAuditLog(req, 'auth.logout', { userId: req.user.id });
    }

    clearAuthCookies(res);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    clearAuthCookies(res);
    sendSuccess(res, null, 'Logged out successfully');
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true },
    });

    let resetToken: string | undefined;
    if (user?.isActive) {
      resetToken = createOpaqueToken();
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(resetToken),
          expiresAt: passwordResetExpiry(),
        },
      });
      await writeAuditLog(req, 'auth.forgot_password', { userId: user.id });
    }

    sendSuccess(
      res,
      process.env.NODE_ENV === 'production' ? null : { resetToken },
      'If the email exists, password reset instructions have been sent'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(error));
      return;
    }
    console.error('Forgot password error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const storedToken = await db.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (
      !storedToken ||
      storedToken.usedAt ||
      storedToken.expiresAt <= new Date() ||
      !storedToken.user.isActive
    ) {
      sendError(res, 400, 'Invalid or expired reset token');
      return;
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_COST);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: storedToken.id },
        data: { usedAt: new Date() },
      }),
      db.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await writeAuditLog(req, 'auth.reset_password', { userId: storedToken.userId });
    clearAuthCookies(res);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'Validation failed', zodToFieldErrors(error));
      return;
    }
    console.error('Reset password error:', error);
    sendError(res, 500, 'Internal server error');
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userPublicSelect,
        studentProfile: {
          select: {
            currentJuz: true,
            currentSurah: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      sendError(res, 404, 'User not found');
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

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      },
      select: userPublicSelect,
    });

    invalidateRoleCache(userId);
    await writeAuditLog(req, 'auth.update_profile', { userId, entity: 'User', entityId: userId });

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
