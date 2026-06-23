import { Router } from 'express';
import { getDashboard, getNavbarStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(getDashboard));
router.get('/navbar-stats', asyncHandler(getNavbarStats));

export default router;
