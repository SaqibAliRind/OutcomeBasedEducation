import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getManagementAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/management', protect, getManagementAnalytics);

export default router;
