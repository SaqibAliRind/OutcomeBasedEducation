import express from 'express';
import { getDeanDashboard } from '../controllers/deanController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('Dean', 'SuperAdmin', 'UniversityAdmin'), getDeanDashboard);

export default router;
