import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getFailingCLOs, getCQIActionRegister, getCQIDashboard } from '../controllers/cqiController.js';

const router = express.Router();

router.use(protect);

// Only QEC, HOD, Dean, Program Coordinator and Admin can view CQI data
const cqiRoles = authorize('SuperAdmin', 'UniversityAdmin', 'Dean', 'HOD', 'ProgramCoordinator', 'QEC');

router.get('/dashboard', cqiRoles, getCQIDashboard);
router.get('/failing-clos', cqiRoles, getFailingCLOs);
router.get('/action-register', cqiRoles, getCQIActionRegister);

export default router;
