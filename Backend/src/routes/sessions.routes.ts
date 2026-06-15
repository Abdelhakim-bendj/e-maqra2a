import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  listSessions, getSession, createSession, updateSessionStatus, joinSession, leaveSession, updateSession,
} from '../controllers/sessions.controller';

const router = Router();
router.use(authenticate);

router.get('/', listSessions);
router.get('/:id', getSession);
router.post('/', authorize('TEACHER', 'ADMIN'), createSession);
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateSession);
router.patch('/:id/status', authorize('TEACHER', 'ADMIN'), updateSessionStatus);
router.post('/:id/join', joinSession);
router.post('/:id/leave', leaveSession);

export default router;
