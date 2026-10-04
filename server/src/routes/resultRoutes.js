import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getResultSummary, getSemesterResults, getMeritList, getResultFilters } from '../controllers/resultController.js';

const router = express.Router();

router.route('/summary').get(protect, admin, getResultSummary);
router.route('/semester').get(protect, admin, getSemesterResults);
router.route('/merit').get(protect, admin, getMeritList);
router.route('/filters').get(protect, admin, getResultFilters);

export default router;
