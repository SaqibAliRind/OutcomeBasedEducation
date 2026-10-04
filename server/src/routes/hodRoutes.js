import express from 'express';
import { getHodDashboard } from '../controllers/hodController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('HOD', 'SuperAdmin', 'UniversityAdmin', 'Dean'), getHodDashboard);

export default router;
