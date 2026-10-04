import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getCoordinatorDashboard } from '../controllers/coordinatorDashController.js';

const router = express.Router();

router.get('/dashboard', protect, getCoordinatorDashboard);

export default router;
