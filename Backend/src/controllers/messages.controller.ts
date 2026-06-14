import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';

const sendMessageSchema = z.object({
  recipientId: z.string().uuid('معرف المستلم غير صالح'),
  content: z.string().trim().min(1, 'محتوى الرسالة مطلوب').max(2000),
});

// GET /api/messages/conversations — list all conversation partners
export const listConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  // Get all unique users the current user has exchanged messages with
  const sent = await prisma.message.findMany({
    where: { senderId: userId },
    select: { recipient: { select: { id: true, fullName: true, role: true, avatarUrl: true } } },
    distinct: ['recipientId'],
    orderBy: { createdAt: 'desc' },
  });

  const received = await prisma.message.findMany({
    where: { recipientId: userId },
    select: { sender: { select: { id: true, fullName: true, role: true, avatarUrl: true } } },
    distinct: ['senderId'],
    orderBy: { createdAt: 'desc' },
  });

  const participantsMap = new Map<string, object>();
  sent.forEach((m) => participantsMap.set(m.recipient.id, m.recipient));
  received.forEach((m) => participantsMap.set(m.sender.id, m.sender));

  const conversations = await Promise.all(
    Array.from(participantsMap.entries()).map(async ([partnerId, partner]) => {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, recipientId: partnerId },
            { senderId: partnerId, recipientId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, isRead: true, senderId: true },
      });

      const unread = await prisma.message.count({
        where: { senderId: partnerId, recipientId: userId, isRead: false },
      });

      return { partner, lastMessage, unread };
    })
  );

  conversations.sort((a, b) =>
    new Date(b.lastMessage?.createdAt ?? 0).getTime() - new Date(a.lastMessage?.createdAt ?? 0).getTime()
  );

  sendSuccess(res, { conversations }, 'Conversations loaded');
};

// GET /api/messages/:userId — get thread with specific user
export const getThread = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const partnerId = req.params.userId;
  const { page = '1', limit = '30' } = req.query as Record<string, string>;
  const take = Math.min(50, parseInt(limit, 10));
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: partnerId },
        { senderId: partnerId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    skip,
    take,
    include: {
      sender: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { senderId: partnerId, recipientId: userId, isRead: false },
    data: { isRead: true },
  });

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, fullName: true, role: true, avatarUrl: true },
  });

  sendSuccess(res, { messages, partner }, 'Thread loaded');
};

// POST /api/messages — send a message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipientId, content } = sendMessageSchema.parse(req.body);
    const senderId = req.user!.id;

    if (senderId === recipientId) { sendError(res, 400, 'لا يمكنك إرسال رسالة لنفسك'); return; }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
    if (!recipient) { sendError(res, 404, 'المستلم غير موجود'); return; }

    const message = await prisma.message.create({
      data: { senderId, recipientId, content },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    // Notify recipient
    await prisma.notification.create({
      data: {
        senderId,
        recipientId,
        type: 'PRIVATE',
        title: 'رسالة جديدة',
        message: content.substring(0, 100),
      },
    });

    sendSuccess(res, { message }, 'Message sent', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};
