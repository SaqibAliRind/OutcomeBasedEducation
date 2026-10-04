import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getAssessmentSettings, 
    createAssessmentSetting, 
    updateAssessmentSetting, 
    deleteAssessmentSetting 
} from '../controllers/assessmentController.js';

const router = express.Router();

router.route('/')
    .get(protect, getAssessmentSettings)
    .post(protect, admin, createAssessmentSetting);

router.route('/:id')
    .put(protect, admin, updateAssessmentSetting)
    .delete(protect, admin, deleteAssessmentSetting);

export default router;
