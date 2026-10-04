import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadEvidence, getEvidence, deleteEvidence } from '../controllers/evidenceController.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('QEC', 'UniversityAdmin', 'SystemAdmin', 'HOD', 'ProgramCoordinator'), uploadEvidence)
    .get(protect, getEvidence);

router.route('/:id')
    .delete(protect, authorize('QEC', 'UniversityAdmin', 'SystemAdmin', 'HOD'), deleteEvidence);

export default router;
