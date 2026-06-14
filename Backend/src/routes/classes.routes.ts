import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  listClasses, getClass, createClass, updateClass, deleteClass,
  assignStudentToClass, removeStudentFromClass,
} from '../controllers/classes.controller';

const router = Router();
router.use(authenticate);

router.get('/', listClasses);
router.get('/:id', getClass);
router.post('/', authorize('ADMIN'), createClass);
router.put('/:id', authorize('ADMIN'), updateClass);
router.delete('/:id', authorize('ADMIN'), deleteClass);
router.post('/:id/students', authorize('ADMIN', 'TEACHER'), assignStudentToClass);
router.delete('/:id/students/:studentId', authorize('ADMIN'), removeStudentFromClass);

export default router;
