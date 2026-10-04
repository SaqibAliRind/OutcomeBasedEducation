import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getMyProfile,
    updateMyProfile,
    changePassword,
    uploadProfilePicture,
    getLoginSessions
} from '../controllers/profileController.js';

const router = express.Router();

router.route('/me')
    .get(protect, getMyProfile)
    .put(protect, updateMyProfile);

router.put('/change-password', protect, changePassword);
router.post('/upload-picture', protect, uploadProfilePicture);
router.get('/sessions', protect, getLoginSessions);

export default router;
