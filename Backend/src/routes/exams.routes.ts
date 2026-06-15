import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  listExams, getExam, createExam, publishExam,
  startExam, submitExam, getExamResults, gradeShortAnswer, updateExam,
} from '../controllers/exams.controller';

const router = Router();
router.use(authenticate);

router.get('/', listExams);
router.get('/:id', getExam);
router.post('/', authorize('TEACHER', 'ADMIN'), createExam);
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateExam);
router.patch('/:id/publish', authorize('TEACHER', 'ADMIN'), publishExam);
router.post('/:id/start', authorize('STUDENT'), startExam);
router.post('/:id/submit', authorize('STUDENT'), submitExam);
router.get('/:id/results', getExamResults);
router.patch('/grade', authorize('TEACHER', 'ADMIN'), gradeShortAnswer);

export default router;
