import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getUniversitySettings,
    updateGeneralSettings,
    updateSettingsSection,
    uploadUniversityAsset,
    getAcademicOptions
} from '../controllers/universitySettingsController.js';

const router = express.Router();

router.get('/', protect, admin, getUniversitySettings);
router.put('/general', protect, admin, updateGeneralSettings);
router.put('/section/:section', protect, admin, updateSettingsSection);
router.post('/upload/:type', protect, admin, uploadUniversityAsset);
router.get('/academic-options', protect, admin, getAcademicOptions);

export default router;
