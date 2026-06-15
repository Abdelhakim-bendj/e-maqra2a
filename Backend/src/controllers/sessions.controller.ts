import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';
import { writeAuditLog } from '../utils/audit';

const createSessionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().max(500).optional(),
  sessionType: z.enum(['MEMORIZATION', 'TAJWEED', 'EDUCATIONAL']),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(15).max(180),
  maxParticipants: z.number().int().min(2).max(100),
  meetingUrl: z.string().url().optional(),
});

// GET /api/sessions
export const listSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;
  const { status } = req.query as { status?: string };

  const where: Record<string, unknown> = {};
  if (role === 'TEACHER') {
    where.teacherId = userId;
  } else if (role === 'STUDENT') {
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (profile?.teacherId) {
      where.teacherId = profile.teacherId;
    } else {
      // If student has no teacher, they shouldn't see any sessions
      where.teacherId = 'no-teacher'; 
    }
  }

  if (status) where.status = status;

  const sessions = await prisma.liveSession.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    include: {
      teacher: { select: { id: true, fullName: true } },
      _count: { select: { attendances: true } },
    },
  });

  sendSuccess(res, { sessions }, 'Sessions loaded');
};

// GET /api/sessions/:id
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.liveSession.findUnique({
    where: { id: req.params.id },
    include: {
      teacher: { select: { id: true, fullName: true } },
      attendances: {
        include: { user: { select: { id: true, fullName: true, role: true } } },
      },
    },
  });

  if (!session) { sendError(res, 404, 'Session not found'); return; }
  sendSuccess(res, { session }, 'Session loaded');
};

// POST /api/sessions
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createSessionSchema.parse(req.body);
    const teacherId = req.user!.id;

    const session = await prisma.liveSession.create({
      data: {
        title: data.title,
        description: data.description,
        sessionType: data.sessionType,
        teacherId,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes,
        maxParticipants: data.maxParticipants,
        meetingUrl: data.meetingUrl,
      },
    });

    await writeAuditLog(req, 'session.create', { entity: 'LiveSession', entityId: session.id });
    sendSuccess(res, { session }, 'Session scheduled', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

// PUT /api/sessions/:id
export const updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createSessionSchema.partial().parse(req.body);
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
    if (!session) { sendError(res, 404, 'Session not found'); return; }
    if (session.teacherId !== req.user!.id && req.user!.role !== 'ADMIN') {
      sendError(res, 403, 'Access denied'); return;
    }
    const updated = await prisma.liveSession.update({
      where: { id: session.id },
      data: {
        title: data.title,
        description: data.description,
        sessionType: data.sessionType,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        durationMinutes: data.durationMinutes,
        maxParticipants: data.maxParticipants,
        meetingUrl: data.meetingUrl,
      },
    });
    await writeAuditLog(req, 'session.update', { entity: 'LiveSession', entityId: session.id });
    sendSuccess(res, { session: updated }, 'Session updated');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

// PATCH /api/sessions/:id/status
export const updateSessionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = z.object({ status: z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED']) }).parse(req.body);
  const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
  if (!session) { sendError(res, 404, 'Session not found'); return; }
  if (session.teacherId !== req.user!.id && req.user!.role !== 'ADMIN') {
    sendError(res, 403, 'Access denied'); return;
  }
  await prisma.liveSession.update({ where: { id: session.id }, data: { status } });
  sendSuccess(res, null, 'Session status updated');
};

// POST /api/sessions/:id/join — record attendance
export const joinSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const sessionId = req.params.id;

  const existing = await prisma.attendance.findFirst({ where: { sessionId, userId, leftAt: null } });
  if (existing) { sendSuccess(res, null, 'Already in session'); return; }

  await prisma.attendance.create({ data: { sessionId, userId } });
  sendSuccess(res, null, 'Joined session');
};

// POST /api/sessions/:id/leave
export const leaveSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  await prisma.attendance.updateMany({
    where: { sessionId: req.params.id, userId, leftAt: null },
    data: { leftAt: new Date() },
  });
  sendSuccess(res, null, 'Left session');
};
