import express from 'express';
const router = express.Router();
import { getSettings, updateSettings, testSmtpConnection, testCloudinaryConnection, triggerManualBackup, downloadBackup, restoreDatabase } from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getSettings);

router.route('/:category')
    .put(protect, admin, updateSettings);

router.post('/test-smtp', protect, admin, testSmtpConnection);
router.post('/test-cloudinary', protect, admin, testCloudinaryConnection);
router.post('/backup', protect, admin, triggerManualBackup);
router.get('/download-backup', protect, admin, downloadBackup);
router.post('/restore', protect, admin, restoreDatabase);

export default router;
