import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getSurveys,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    updateSurveyStatus,
    submitSurveyResponse,
    calculateIndirectAssessment
} from '../controllers/surveyController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
    .get(getSurveys)
    .post(createSurvey);

router.route('/:id')
    .put(updateSurvey)
    .delete(deleteSurvey);

router.route('/:id/status')
    .patch(updateSurveyStatus);

router.route('/:id/responses')
    .post(submitSurveyResponse);

router.route('/:id/calculate-indirect')
    .post(calculateIndirectAssessment);

export default router;
