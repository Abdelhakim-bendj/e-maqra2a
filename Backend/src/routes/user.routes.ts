import { Router } from 'express';
import { Role } from '@prisma/client';
import { createUser, listUsers, updateUser, selectTeacher, acceptStudent } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Role.ADMIN, Role.TEACHER, Role.STUDENT), asyncHandler(listUsers));
router.post('/', authorize(Role.ADMIN), asyncHandler(createUser));
router.patch('/:id', authorize(Role.ADMIN), asyncHandler(updateUser));
router.post('/select-teacher', authorize(Role.STUDENT), asyncHandler(selectTeacher));
router.post('/accept-student', authorize(Role.TEACHER), asyncHandler(acceptStudent));

export default router;
