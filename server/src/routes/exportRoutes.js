import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { exportCLOReport, exportPLOReport, exportCQIReport, exportMarksReport, exportAttainmentReport } from '../controllers/exportController.js';

const router = express.Router();

router.use(protect);

const analyticsRoles = authorize('SuperAdmin', 'UniversityAdmin', 'Dean', 'HOD', 'ProgramCoordinator', 'QEC');

// OBE Achievement Reports — all formats (excel, pdf, csv)
router.get('/clo-report', analyticsRoles, exportCLOReport);
router.get('/plo-report', analyticsRoles, exportPLOReport);
router.get('/cqi-report', analyticsRoles, exportCQIReport);

// Marks report — Admin/Dean/HOD access
router.get('/marks-report', authorize('SuperAdmin', 'UniversityAdmin', 'Dean', 'HOD'), exportMarksReport);

// Per-course-offering student attainment — Teacher and up
router.get('/attainment-report', authorize('Teacher', 'HOD', 'ProgramCoordinator', 'Dean', 'UniversityAdmin', 'SuperAdmin'), exportAttainmentReport);

export default router;
