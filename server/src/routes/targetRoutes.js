import express from 'express';
import { getTargets, updateTargets } from '../controllers/targetController.js';
import { protect, admin, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All academic staff need to view targets for reports, only admins can modify
router.route('/')
    .get(protect, authorize('SuperAdmin', 'UniversityAdmin', 'Dean', 'HOD', 'ProgramCoordinator', 'QEC', 'Teacher'), getTargets)
    .put(protect, admin, updateTargets);

export default router;
