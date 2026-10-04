import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { markAttendance, getAttendance, getAttendanceStats, getAttendanceReports, approveAttendance, getAttendanceAnalytics, getDetailedReports, sendAttendanceAlerts, deleteAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.post('/', authorize('Teacher', 'HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), markAttendance);
router.get('/', authorize('Teacher', 'HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getAttendance);
router.get('/stats', authorize('Teacher', 'HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getAttendanceStats);
router.get('/reports', authorize('Teacher', 'HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getAttendanceReports);
router.get('/analytics', authorize('Teacher', 'HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getAttendanceAnalytics);
router.get('/detailed-reports', authorize('Teacher', 'HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getDetailedReports);
router.post('/alerts', authorize('HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), sendAttendanceAlerts);
router.patch('/:id/approve', authorize('HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), approveAttendance);
router.delete('/:id', authorize('Teacher', 'HOD', 'Dean', 'UniversityAdmin', 'SuperAdmin'), deleteAttendance);

export default router;
