import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getCourseFiles, getByOffering, updateSection, updateStatus, uploadDocument } from '../controllers/courseFileController.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('Teacher', 'HOD', 'Dean', 'ProgramCoordinator', 'QEC', 'UniversityAdmin', 'SuperAdmin'), getCourseFiles);
router.get('/offering/:offeringId', authorize('Teacher', 'HOD', 'Dean', 'ProgramCoordinator', 'QEC', 'UniversityAdmin', 'SuperAdmin'), getByOffering);
router.patch('/:id/section', authorize('Teacher'), updateSection);
router.patch('/:id/status', authorize('Teacher', 'HOD', 'Dean', 'ProgramCoordinator', 'QEC', 'UniversityAdmin', 'SuperAdmin'), updateStatus);
router.post('/:id/upload', authorize('Teacher'), uploadDocument);

export default router;

