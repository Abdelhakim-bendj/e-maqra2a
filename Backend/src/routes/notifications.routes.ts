import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { listNotifications, sendNotification, markRead, markAllRead } from '../controllers/notifications.controller';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.post('/send', authorize('ADMIN', 'TEACHER'), sendNotification);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
