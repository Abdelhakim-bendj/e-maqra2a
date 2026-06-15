import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  listTasks,
  getTask,
  createTask,
  createBulkTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/tasks.controller';

const router = Router();

router.use(authenticate);

router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/', authorize('TEACHER', 'ADMIN'), createTask);
router.post('/bulk', authorize('TEACHER', 'ADMIN'), createBulkTask);
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteTask);

export default router;
