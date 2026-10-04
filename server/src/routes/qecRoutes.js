import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getQECDashboardData } from '../controllers/qecController.js';

const router = express.Router();

router.route('/dashboard')
    .get(protect, authorize('QEC', 'UniversityAdmin', 'SuperAdmin', 'Dean'), getQECDashboardData);

export default router;
