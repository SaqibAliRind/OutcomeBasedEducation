import express from 'express';
import { 
    getAssessments, 
    createAssessment, 
    updateAssessment, 
    deleteAssessment 
} from '../controllers/assessmentDefinitionController.js';
import { protect, admin, authorize } from '../middleware/authMiddleware.js';
import { isAssessmentCreator } from '../middleware/rowLevelAuth.js';
import { checkDataLock } from '../middleware/dataLocking.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('Teacher', 'HOD', 'ProgramCoordinator', 'Dean', 'UniversityAdmin', 'SuperAdmin'), getAssessments)
    .post(protect, authorize('Teacher', 'HOD', 'UniversityAdmin', 'SuperAdmin'), checkDataLock, createAssessment);

router.route('/:id')
    .put(protect, authorize('Teacher', 'HOD', 'UniversityAdmin', 'SuperAdmin'), isAssessmentCreator, checkDataLock, updateAssessment)
    .delete(protect, authorize('Teacher', 'HOD', 'UniversityAdmin', 'SuperAdmin'), isAssessmentCreator, checkDataLock, deleteAssessment);

export default router;
