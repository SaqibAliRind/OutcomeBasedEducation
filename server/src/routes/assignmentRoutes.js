import express from 'express';
import {
    getTeachersForAssignment,
    getAssignmentSummary,
    assignTeacherToDepartment,
    assignTeacherToProgram,
    assignTeacherToSection,
    getTeacherWorkload
} from '../controllers/assignmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.get('/teachers',    protect, getTeachersForAssignment);
router.get('/summary',     protect, getAssignmentSummary);
router.get('/workload',    protect, getTeacherWorkload);
router.put('/department',  protect, assignTeacherToDepartment);
router.put('/program',     protect, assignTeacherToProgram);
router.put('/section',     protect, assignTeacherToSection);

export default router;
