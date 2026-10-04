import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getStudentGPA,
    getStudentCGPA,
    getStudentTranscript
} from '../controllers/academicRecordController.js';

const router = express.Router();

router.get('/gpa/:studentId', protect, getStudentGPA);
router.get('/cgpa/:studentId', protect, getStudentCGPA);
router.get('/transcript/:studentId', protect, getStudentTranscript);

export default router;
