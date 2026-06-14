import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendError } from '../utils/api-response';
import { verifyAccessToken } from '../utils/security';
import { Role } from '../types/auth';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
    email?: string;
  };
}

/**
 * Simple in-memory cache for user roles to avoid DB hits on every request.
 * TTL: 5 minutes. In production, use Redis.
 */
const roleCache = new Map<string, { role: Role; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getUserRole(userId: string): Promise<Role | null> {
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.role;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  roleCache.set(userId, { role: user.role, expiresAt: Date.now() + CACHE_TTL_MS });
  return user.role;
}

export function invalidateRoleCache(userId: string): void {
  roleCache.delete(userId);
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined = req.cookies?.access_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    const decoded = verifyAccessToken(token);
    const userId = decoded.sub;

    if (!userId) {
      sendError(res, 401, 'Invalid token payload');
      return;
    }

    const role = await getUserRole(userId);
    if (!role) {
      sendError(res, 401, 'User inactive or not found');
      return;
    }

    req.user = {
      id: userId,
      role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      sendError(res, 401, 'Token expired');
      return;
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      sendError(res, 401, 'Invalid token');
      return;
    }
    console.error('Auth middleware error:', error);
    sendError(res, 500, 'Authentication failed');
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 403, 'Forbidden: Insufficient privileges');
      return;
    }

    next();
  };
};
