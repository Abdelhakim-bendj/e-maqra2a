import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  listContent, getContent, createContent, updateContent, deleteContent,
  listTajweed, getTajweed, createTajweed, updateTajweed, deleteTajweed,
} from '../controllers/content.controller';

const router = Router();
router.use(authenticate);

// Islamic content routes
router.get('/islamic', listContent);
router.get('/islamic/:id', getContent);
router.post('/islamic', authorize('ADMIN'), createContent);
router.put('/islamic/:id', authorize('ADMIN'), updateContent);
router.delete('/islamic/:id', authorize('ADMIN'), deleteContent);

// Tajweed lesson routes
router.get('/tajweed', listTajweed);
router.get('/tajweed/:id', getTajweed);
router.post('/tajweed', authorize('ADMIN', 'TEACHER'), createTajweed);
router.put('/tajweed/:id', authorize('ADMIN', 'TEACHER'), updateTajweed);
router.delete('/tajweed/:id', authorize('ADMIN', 'TEACHER'), deleteTajweed);

export default router;
