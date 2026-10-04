import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getEnrollments,
    getAvailableOfferings,
    enrollInCourse,
    dropCourse,
    enrollInSemester
} from '../controllers/enrollmentController.js';

const router = express.Router();

router.get('/', protect, getEnrollments);
router.get('/offerings', protect, getAvailableOfferings);
router.post('/course', protect, enrollInCourse);
router.patch('/:id/drop', protect, dropCourse);
router.post('/semester', protect, enrollInSemester);

export default router;
