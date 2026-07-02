import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';

const sendNotificationSchema = z.object({
  recipientId: z.string().uuid().optional(),
  recipientRole: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional(),
  classId: z.string().uuid().optional(),
  type: z.enum(['ANNOUNCEMENT', 'PRIVATE', 'AUTO']),
  title: z.string().trim().min(2, 'العنوان مطلوب').max(200),
  message: z.string().trim().min(5, 'نص الرسالة مطلوب').max(2000),
});

// GET /api/notifications
export const listNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { unreadOnly } = req.query as { unreadOnly?: string };

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(unreadOnly === 'true' ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  });

  sendSuccess(res, { notifications, unreadCount }, 'Notifications loaded');
};

// POST /api/notifications/send
export const sendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = sendNotificationSchema.parse(req.body);
    const senderId = req.user!.id;
    const { role } = req.user!;

    // Only teachers can send private; admins can broadcast
    if (data.type === 'ANNOUNCEMENT' && role !== 'ADMIN') {
      sendError(res, 403, 'Only admins can send announcements'); return;
    }

    let recipientIds: string[] = [];

    if (data.recipientId) {
      recipientIds = [data.recipientId];
    } else if (data.recipientRole) {
      let roleWhere: any = { role: data.recipientRole as any, isActive: true };
      
      // Prevent teachers from broadcasting to all students platform-wide
      if (role === 'TEACHER' && data.recipientRole === 'STUDENT') {
        roleWhere = {
          ...roleWhere,
          studentProfile: { teacherId: senderId },
        };
      }

      const users = await prisma.profile.findMany({
        where: roleWhere,
        select: { id: true },
      });
      recipientIds = users.map((u) => u.id);
    } else if (data.classId) {
      const profiles = await prisma.studentProfile.findMany({
        where: { classId: data.classId },
        select: { userId: true },
      });
      recipientIds = profiles.map((p) => p.userId);
    } else {
      sendError(res, 400, 'يجب تحديد مستلم أو دور أو فصل'); return;
    }

    await prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        senderId,
        recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
      })),
    });

    sendSuccess(res, { count: recipientIds.length }, `Sent to ${recipientIds.length} recipient(s)`, 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    console.error('Send notification error:', err);
    sendError(res, 500, 'Internal server error');
  }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, recipientId: req.user!.id },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'Notification marked as read');
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { recipientId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'All notifications marked as read');
};
