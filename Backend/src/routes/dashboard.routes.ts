import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

router.get('/', authenticate, asyncHandler(getDashboard));

export default router;
