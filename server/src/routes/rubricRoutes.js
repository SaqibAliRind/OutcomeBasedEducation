import express from 'express';
import {
    getRubrics,
    createRubric,
    updateRubric,
    deleteRubric,
    copyRubric
} from '../controllers/rubricController.js';
import { evaluateStudentWithRubric, getStudentEvaluation } from '../controllers/rubricEvaluationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkDataLock } from '../middleware/dataLocking.js';

const router = express.Router();

const allowedRoles = authorize('SuperAdmin', 'UniversityAdmin', 'HOD', 'Teacher');

router.route('/')
    .get(protect, getRubrics)
    .post(protect, allowedRoles, createRubric);

router.post('/copy', protect, allowedRoles, copyRubric);

// Rubric Evaluation Engine
router.post('/evaluate', protect, authorize('Teacher', 'HOD', 'UniversityAdmin', 'SuperAdmin'), checkDataLock, evaluateStudentWithRubric);
router.get('/evaluate/:assessmentId/:studentId', protect, authorize('Teacher', 'HOD', 'ProgramCoordinator', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getStudentEvaluation);

router.route('/:id')
    .put(protect, allowedRoles, updateRubric)
    .delete(protect, allowedRoles, deleteRubric);

export default router;
