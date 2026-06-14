import { Router } from 'express';
import { Role } from '@prisma/client';
import { createUser, listUsers, updateUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Role.ADMIN), asyncHandler(listUsers));
router.post('/', authorize(Role.ADMIN), asyncHandler(createUser));
router.patch('/:id', authorize(Role.ADMIN), asyncHandler(updateUser));

export default router;
