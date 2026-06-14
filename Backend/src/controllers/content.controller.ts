import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendError, sendSuccess, zodToFieldErrors } from '../utils/api-response';

const contentSchema = z.object({
  title: z.string().trim().min(2).max(200),
  content: z.string().min(10),
  category: z.enum(['SUPPLICATION', 'SEERAH', 'COMPANION']),
  subcategory: z.string().max(100).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  orderIndex: z.number().int().min(0).default(0),
});

const tajweedSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(500).optional(),
  category: z.enum(['MAKHARIJ', 'SIFAAT', 'NOON_SAKINAH', 'MEEM_SAKINAH', 'MADD', 'GHUNNA']),
  content: z.string().min(10),
  videoUrl: z.string().url().optional().or(z.literal('')),
  pdfUrl: z.string().optional().or(z.literal('')),
  orderIndex: z.number().int().min(0).default(0),
});

// ─── Islamic Content ───────────────────────────────────────────────

export const listContent = async (req: AuthRequest, res: Response): Promise<void> => {
  const { category } = req.query as { category?: string };
  const where = category ? { category: category as any } : {};

  const items = await prisma.islamicContent.findMany({
    where,
    orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
  });

  sendSuccess(res, { items }, 'Content loaded');
};

export const getContent = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await prisma.islamicContent.findUnique({ where: { id: req.params.id } });
  if (!item) { sendError(res, 404, 'Content not found'); return; }
  sendSuccess(res, { item }, 'Content loaded');
};

export const createContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = contentSchema.parse(req.body);
    const item = await prisma.islamicContent.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        subcategory: data.subcategory,
        mediaUrls: data.mediaUrls ?? [],
        orderIndex: data.orderIndex,
      },
    });
    sendSuccess(res, { item }, 'Content created', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

export const updateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = contentSchema.partial().parse(req.body);
    const item = await prisma.islamicContent.update({ where: { id: req.params.id }, data });
    sendSuccess(res, { item }, 'Content updated');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

export const deleteContent = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.islamicContent.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Content deleted');
};

// ─── Tajweed Lessons ────────────────────────────────────────────────

export const listTajweed = async (req: AuthRequest, res: Response): Promise<void> => {
  const { category } = req.query as { category?: string };
  let where: any = category ? { category: category as any } : {};

  if (req.user!.role === 'STUDENT') {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (profile?.teacherId) {
      where.createdBy = profile.teacherId;
    } else {
      where.createdBy = 'none'; // Don't show any if no teacher assigned
    }
  } else if (req.user!.role === 'TEACHER') {
    where.createdBy = req.user!.id;
  }

  const lessons = await prisma.tajweedLesson.findMany({
    where,
    orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
    include: { creator: { select: { fullName: true } } },
  });

  sendSuccess(res, { lessons }, 'Tajweed lessons loaded');
};

export const getTajweed = async (req: AuthRequest, res: Response): Promise<void> => {
  const lesson = await prisma.tajweedLesson.findUnique({
    where: { id: req.params.id },
    include: { creator: { select: { fullName: true } } },
  });
  if (!lesson) { sendError(res, 404, 'Lesson not found'); return; }
  sendSuccess(res, { lesson }, 'Lesson loaded');
};

export const createTajweed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = tajweedSchema.parse(req.body);
    const lesson = await prisma.tajweedLesson.create({
      data: { ...data, createdBy: req.user!.id },
    });
    sendSuccess(res, { lesson }, 'Lesson created', 201);
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

export const updateTajweed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = tajweedSchema.partial().parse(req.body);
    const lesson = await prisma.tajweedLesson.update({ where: { id: req.params.id }, data });
    sendSuccess(res, { lesson }, 'Lesson updated');
  } catch (err) {
    if (err instanceof z.ZodError) { sendError(res, 400, 'Validation failed', zodToFieldErrors(err)); return; }
    sendError(res, 500, 'Internal server error');
  }
};

export const deleteTajweed = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.tajweedLesson.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Lesson deleted');
};
