import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { isCourseTeacher } from '../middleware/rowLevelAuth.js';
import { checkDataLock } from '../middleware/dataLocking.js';
import { submitMarks, getMarks, getMarksStats, updateMarkStatus, getMarksReports } from '../controllers/markController.js';

const router = express.Router();

router.use(protect);

router.post('/submit', authorize('Teacher', 'UniversityAdmin', 'SuperAdmin'), isCourseTeacher, checkDataLock, submitMarks);
router.get('/', authorize('Teacher', 'UniversityAdmin', 'SuperAdmin'), getMarks);
router.get('/stats', authorize('UniversityAdmin', 'SuperAdmin'), getMarksStats);
router.get('/reports', authorize('UniversityAdmin', 'SuperAdmin'), getMarksReports);
router.patch('/:id/status', authorize('UniversityAdmin', 'SuperAdmin'), updateMarkStatus);

export default router;
