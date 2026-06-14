import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listConversations, getThread, sendMessage } from '../controllers/messages.controller';

const router = Router();
router.use(authenticate);

router.get('/conversations', listConversations);
router.get('/:userId', getThread);
router.post('/', sendMessage);

export default router;
