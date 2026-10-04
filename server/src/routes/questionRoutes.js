import express from 'express';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, getStats } from '../controllers/questionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { isQuestionTeacher } from '../middleware/rowLevelAuth.js';
import { checkDataLock } from '../middleware/dataLocking.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Teacher', 'HOD', 'UniversityAdmin'));

router.get('/', getQuestions);
router.post('/', checkDataLock, createQuestion);
router.put('/:id', isQuestionTeacher, checkDataLock, updateQuestion);
router.delete('/:id', isQuestionTeacher, checkDataLock, deleteQuestion);
router.get('/stats', getStats);

export default router;
