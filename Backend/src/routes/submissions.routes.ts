import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  listSubmissions, getSubmission, createSubmission, createAssessment,
} from '../controllers/submissions.controller';

const router = Router();
router.use(authenticate);

router.get('/', listSubmissions);
router.get('/:id', getSubmission);
router.post('/', authorize('STUDENT'), createSubmission);
router.post('/assess', authorize('TEACHER', 'ADMIN'), createAssessment);

export default router;
