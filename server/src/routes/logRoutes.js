import express from 'express';
import { getLogs, deleteLogs, getAiStats } from '../controllers/logController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getLogs)
  .delete(protect, admin, deleteLogs);

router.get('/ai-stats', protect, admin, getAiStats);

export default router;