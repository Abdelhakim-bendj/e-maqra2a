import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getStudentReport, getClassReport, getAdminReport } from '../controllers/reports.controller';

const router = Router();
router.use(authenticate);
router.use(authorize('TEACHER', 'ADMIN'));

router.get('/student/:studentId', getStudentReport);
router.get('/class/:classId', getClassReport);
router.get('/admin', authorize('ADMIN'), getAdminReport);

export default router;
