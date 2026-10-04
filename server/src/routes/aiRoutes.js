import express from 'express';
import {
    generateQuestion,
    suggestCLOs,
    suggestPLOs,
    detectBTLevel,
    suggestActionVerbs,
    generateBlueprint,
    generateRubric,
    analyzeDifficulty,
    detectDuplicate,
    predictAttendance,
    detectAtRisk,
    predictGrade,
    predictGPA,
    analyzePerformance,
    studentRecommendations,
    // Management
    surveyAnalysis,
    sentimentAnalysis,
    notificationSuggestions,
    workflowDelay,
    autoReminder,
    qualityScore,
    qecRecommendations,
    accreditationChecklist,
    // Teaching AI
    generateLectureNotes,
    generatePPTOutline,
    generateQuiz,
    generateAssignment,
    generateProgrammingQuestion,
    generateLabManual
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// OBE AI Tools
router.post('/generate-question',    protect, generateQuestion);
router.post('/suggest-clo',          protect, suggestCLOs);
router.post('/suggest-plo',          protect, suggestPLOs);
router.post('/detect-bt-level',      protect, detectBTLevel);
router.post('/suggest-action-verbs', protect, suggestActionVerbs);
router.post('/generate-blueprint',   protect, generateBlueprint);
router.post('/generate-rubric',      protect, generateRubric);
router.post('/analyze-difficulty',   protect, analyzeDifficulty);
router.post('/detect-duplicate',     protect, detectDuplicate);

// Student Analytics AI
router.post('/predict-attendance',      protect, predictAttendance);
router.post('/detect-at-risk',          protect, detectAtRisk);
router.post('/predict-grade',           protect, predictGrade);
router.post('/predict-gpa',             protect, predictGPA);
router.post('/analyze-performance',     protect, analyzePerformance);
router.post('/student-recommendations', protect, studentRecommendations);

// Management AI
router.post('/survey-analysis',          protect, surveyAnalysis);
router.post('/sentiment-analysis',       protect, sentimentAnalysis);
router.post('/notification-suggestions', protect, notificationSuggestions);
router.post('/workflow-delay',           protect, workflowDelay);
router.post('/auto-reminder',            protect, autoReminder);
router.post('/quality-score',            protect, qualityScore);
router.post('/qec-recommendations',      protect, qecRecommendations);
router.post('/accreditation-checklist',  protect, accreditationChecklist);

// Teaching AI
router.post('/generate-lecture-notes',       protect, generateLectureNotes);
router.post('/generate-ppt-outline',         protect, generatePPTOutline);
router.post('/generate-quiz',                protect, generateQuiz);
router.post('/generate-assignment',          protect, generateAssignment);
router.post('/generate-programming-question',protect, generateProgrammingQuestion);
router.post('/generate-lab-manual',          protect, generateLabManual);

export default router;

